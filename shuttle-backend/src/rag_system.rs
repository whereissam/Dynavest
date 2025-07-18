use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, PointStruct, SearchPointsBuilder, VectorParamsBuilder,
    UpsertPointsBuilder,
};
use qdrant_client::Payload;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, error};
use anyhow::Result;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbeddingRequest {
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub limit: u64,
    pub score_threshold: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub content: String,
    pub score: f32,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CacheEntry {
    pub query: String,
    pub answer: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

pub struct RAGSystem {
    qdrant_client: Qdrant,
    openai_client: openai_api_rs::v1::api::Client,
    regular_collection: String,
    cache_collection: String,
}

impl RAGSystem {
    pub fn new(qdrant_client: Qdrant, openai_api_key: String) -> Self {
        let openai_client = openai_api_rs::v1::api::Client::new(openai_api_key);
        
        Self {
            qdrant_client,
            openai_client,
            regular_collection: "defi_knowledge".to_string(),
            cache_collection: "defi_knowledge_cache".to_string(),
        }
    }

    /// Initialize both regular and cache collections
    pub async fn initialize_collections(&self) -> Result<()> {
        info!("Initializing RAG system collections...");
        
        // Initialize regular collection
        self.create_regular_collection().await?;
        
        // Initialize cache collection
        self.create_cache_collection().await?;
        
        info!("RAG system collections initialized successfully");
        Ok(())
    }

    /// Create regular collection for document storage
    async fn create_regular_collection(&self) -> Result<()> {
        let collections = self.qdrant_client.list_collections().await?;
        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == self.regular_collection);

        if !collection_exists {
            info!("Creating regular collection: {}", self.regular_collection);
            
            self.qdrant_client
                .create_collection(
                    CreateCollectionBuilder::new(&self.regular_collection)
                        .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
                )
                .await?;
        } else {
            info!("Regular collection already exists: {}", self.regular_collection);
        }

        Ok(())
    }

    /// Create cache collection for semantic caching
    async fn create_cache_collection(&self) -> Result<()> {
        let collections = self.qdrant_client.list_collections().await?;
        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == self.cache_collection);

        if !collection_exists {
            info!("Creating cache collection: {}", self.cache_collection);
            
            self.qdrant_client
                .create_collection(
                    CreateCollectionBuilder::new(&self.cache_collection)
                        .vectors_config(VectorParamsBuilder::new(1536, Distance::Euclid))
                )
                .await?;
        } else {
            info!("Cache collection already exists: {}", self.cache_collection);
        }

        Ok(())
    }

    /// Generate embeddings for text
    pub async fn embed_text(&self, text: &str) -> Result<Vec<f32>> {
        let request = openai_api_rs::v1::embedding::EmbeddingRequest {
            model: "text-embedding-ada-002".to_string(),
            input: text.to_string(),
            user: None,
        };

        let response = self.openai_client.embedding(request)
            .map_err(|e| anyhow::anyhow!("OpenAI embedding error: {}", e))?;
        
        if let Some(embedding) = response.data.first() {
            Ok(embedding.embedding.clone())
        } else {
            Err(anyhow::anyhow!("No embedding returned from OpenAI"))
        }
    }

    /// Add document to regular collection
    pub async fn add_document(&self, text: &str, metadata: HashMap<String, String>) -> Result<String> {
        let embedding = self.embed_text(text).await?;
        let document_id = Uuid::new_v4().to_string();
        
        let mut payload = serde_json::json!({
            "content": text,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });
        
        // Add metadata to payload
        for (key, value) in metadata {
            payload[key] = serde_json::Value::String(value);
        }
        
        let points = vec![PointStruct::new(
            document_id.clone(),
            embedding,
            Payload::try_from(payload)?,
        )];

        self.qdrant_client
            .upsert_points(UpsertPointsBuilder::new(&self.regular_collection, points))
            .await?;

        info!("Document added to regular collection with ID: {}", document_id);
        Ok(document_id)
    }

    /// Search regular collection for similar documents
    pub async fn search_documents(&self, query: &str, limit: u64, score_threshold: Option<f32>) -> Result<Vec<SearchResult>> {
        let embedding = self.embed_text(query).await?;
        
        let mut search_builder = SearchPointsBuilder::new(&self.regular_collection, embedding, limit)
            .with_payload(true);
            
        if let Some(threshold) = score_threshold {
            search_builder = search_builder.score_threshold(threshold);
        }

        let search_result = self.qdrant_client
            .search_points(search_builder)
            .await?;

        let mut results = Vec::new();
        for point in search_result.result {
            let content = point.payload
                .get("content")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_default();
                
            let mut metadata = HashMap::new();
            for (key, value) in point.payload.iter() {
                if key != "content" {
                    if let Some(str_value) = value.as_str() {
                        metadata.insert(key.clone(), str_value.to_string());
                    }
                }
            }

            results.push(SearchResult {
                content,
                score: point.score,
                metadata,
            });
        }

        Ok(results)
    }

    /// Search cache collection for similar queries
    pub async fn search_cache(&self, query: &str) -> Result<Option<String>> {
        let embedding = self.embed_text(query).await?;

        let search_result = self.qdrant_client
            .search_points(
                SearchPointsBuilder::new(&self.cache_collection, embedding, 1)
                    .with_payload(true)
                    .score_threshold(0.95) // High threshold for cache hits
            )
            .await?;

        if let Some(point) = search_result.result.first() {
            let answer = point.payload
                .get("answer")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            
            info!("Cache hit for query with score: {}", point.score);
            return Ok(answer);
        }

        Ok(None)
    }

    /// Add response to cache
    pub async fn add_to_cache(&self, query: &str, answer: &str) -> Result<String> {
        let embedding = self.embed_text(query).await?;
        let cache_id = Uuid::new_v4().to_string();
        
        let payload = serde_json::json!({
            "query": query,
            "answer": answer,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });
        
        let points = vec![PointStruct::new(
            cache_id.clone(),
            embedding,
            Payload::try_from(payload)?,
        )];

        self.qdrant_client
            .upsert_points(UpsertPointsBuilder::new(&self.cache_collection, points))
            .await?;

        info!("Response cached with ID: {}", cache_id);
        Ok(cache_id)
    }

    /// Generate AI response using RAG
    pub async fn generate_rag_response(&self, query: &str, context_limit: u64) -> Result<String> {
        // First, check cache
        if let Some(cached_answer) = self.search_cache(query).await? {
            info!("Returning cached response for query");
            return Ok(cached_answer);
        }

        // Search for relevant documents
        let search_results = self.search_documents(query, context_limit, Some(0.7)).await?;
        
        if search_results.is_empty() {
            info!("No relevant documents found for query");
            return Ok("I don't have enough information to answer that question about DeFi strategies.".to_string());
        }

        // Build context from search results
        let context = search_results
            .iter()
            .map(|result| result.content.clone())
            .collect::<Vec<String>>()
            .join("\n\n");

        // Generate response using OpenAI
        let system_prompt = format!(
            "You are DynaVest AI, a DeFi strategy advisor. Use the following context to answer questions about DeFi strategies, yield farming, and investment opportunities. Provide helpful, accurate advice.\n\nContext:\n{}\n\nAnswer the user's question based on the context provided. If the context doesn't contain enough information, say so.",
            context
        );

        let request = openai_api_rs::v1::chat_completion::ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                openai_api_rs::v1::chat_completion::ChatCompletionMessage {
                    role: openai_api_rs::v1::chat_completion::MessageRole::system,
                    content: system_prompt,
                    name: None,
                    function_call: None,
                },
                openai_api_rs::v1::chat_completion::ChatCompletionMessage {
                    role: openai_api_rs::v1::chat_completion::MessageRole::user,
                    content: query.to_string(),
                    name: None,
                    function_call: None,
                },
            ],
            functions: None,
            function_call: None,
            temperature: Some(0.7),
            top_p: None,
            n: None,
            stream: None,
            stop: None,
            max_tokens: Some(1000),
            presence_penalty: None,
            frequency_penalty: None,
            logit_bias: None,
            user: None,
        };

        let response = self.openai_client.chat_completion(request)
            .map_err(|e| anyhow::anyhow!("OpenAI chat completion error: {}", e))?;
        
        if let Some(choice) = response.choices.first() {
            let answer = choice.message.content.as_deref().unwrap_or("No response generated").to_string();
            
            // Cache the response
            if let Err(e) = self.add_to_cache(query, &answer).await {
                error!("Failed to cache response: {}", e);
            }
            
            Ok(answer)
        } else {
            Err(anyhow::anyhow!("No response generated from OpenAI"))
        }
    }

    /// Bulk insert documents from text data
    pub async fn bulk_insert_documents(&self, documents: Vec<(String, HashMap<String, String>)>) -> Result<Vec<String>> {
        let mut document_ids = Vec::new();
        
        for (text, metadata) in documents {
            match self.add_document(&text, metadata).await {
                Ok(doc_id) => {
                    document_ids.push(doc_id);
                }
                Err(e) => {
                    error!("Failed to insert document: {}", e);
                }
            }
        }
        
        info!("Bulk inserted {} documents", document_ids.len());
        Ok(document_ids)
    }

    /// Get collection statistics
    pub async fn get_collection_stats(&self) -> Result<HashMap<String, u64>> {
        let mut stats = HashMap::new();
        
        // Get regular collection info
        if let Ok(regular_info) = self.qdrant_client.collection_info(&self.regular_collection).await {
            if let Some(info) = regular_info.result {
                stats.insert("regular_documents".to_string(), info.points_count.unwrap_or(0));
            }
        }
        
        // Get cache collection info
        if let Ok(cache_info) = self.qdrant_client.collection_info(&self.cache_collection).await {
            if let Some(info) = cache_info.result {
                stats.insert("cached_responses".to_string(), info.points_count.unwrap_or(0));
            }
        }
        
        Ok(stats)
    }
}