"use client";

import Image from "next/image";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import ChainSelector from "../ChainSelector";
import CopyButton from "../CopyButton";
import { useAssets } from "@/contexts/AssetsContext";
import { usePolkadotWallet } from "../PolkadotWallet/PolkadotWalletProvider";

export default function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { ready: privyReady, authenticated, linkWallet, user } = usePrivy();
  console.log("privyReady", privyReady);
  console.log("authenticated", authenticated);
  console.log("user", user);
  const { login } = useAssets();
  const { 
    account: polkadotAccount, 
    isConnected: polkadotConnected, 
    connectWallet: connectPolkadotWallet,
    isLoading: polkadotLoading 
  } = usePolkadotWallet();

  const { logout } = useLogout({
    onSuccess: () => {
      if (
        localStorage.getItem("onboarding-dialog-shown") !== "never-show-again"
      )
        localStorage.setItem(`onboarding-dialog-shown`, "false");
    },
  });

  const { disconnect } = useDisconnect();

  // business logic
  const buttonReady = privyReady && !isLoading && !polkadotLoading;
  const evmLoggedIn = privyReady && authenticated && address;
  const loggedIn = evmLoggedIn || polkadotConnected;

  const handleButtonOnClick = () => {
    if (!buttonReady) return;
    if (!loggedIn) {
      setIsDropdownOpen(!isDropdownOpen);
      return;
    }
  };

  const handleEVMConnect = () => {
    setIsDropdownOpen(false);
    if (authenticated) {
      linkWallet();
    } else {
      login();
    }
  };

  const handlePolkadotConnect = () => {
    setIsDropdownOpen(false);
    connectPolkadotWallet();
  };

  const handleDisconnect = async () => {
    try {
      setIsDropdownOpen(false);
      setIsLoading(true);
      
      // Disconnect EVM wallet
      if (evmLoggedIn) {
        await logout();
        disconnect();
      }
      
      // Disconnect Polkadot wallet
      if (polkadotConnected) {
        localStorage.removeItem('polkadot-selected-account');
        // Force page reload to reset Polkadot state
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // DROPDOWN - close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user?.smartWallet?.address) return;
    setAddress(user.smartWallet.address);
  }, [user]);

  // Get current wallet display info
  const getCurrentWalletInfo = () => {
    if (evmLoggedIn) {
      return {
        name: user?.google?.name || 'EVM Wallet',
        address: address,
        type: 'EVM'
      };
    } else if (polkadotConnected && polkadotAccount) {
      return {
        name: polkadotAccount.meta.name || 'Polkadot',
        address: polkadotAccount.address,
        type: 'Polkadot'
      };
    }
    return null;
  };

  const currentWallet = getCurrentWalletInfo();

  const backgroundStyle = {
    background:
      "linear-gradient(-86.667deg, rgba(95, 121, 241, 30%) 18%, rgba(253, 164, 175, 30%) 100%)",
  };

  return (
    <div
      className={`relative flex items-center justify-center text-center gap-x-1 ${
        isDropdownOpen ? "rounded-t-[10px]" : "rounded-[10px]"
      } py-2 px-3 w-[150px] md:w-[190px] h-[48px]`}
      style={backgroundStyle}
      ref={dropdownRef}
    >
      <div
        className={`flex items-center max-w-[30%] ml-2 ${
          !authenticated ? "hidden" : ""
        }`}
      >
        {/* Chain Selector */}
        <ChainSelector />
      </div>

      <div
        onClick={handleButtonOnClick}
        className="pl-1 cursor-pointer flex items-center justify-between w-full h-full"
      >
        <div className="flex items-center gap-3 w-full mr-2">
          {buttonReady ? (
            loggedIn ? (
              <div className="flex items-center justify-between w-full">
                {/* User info with wallet */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* User info */}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-bold text-[13px] text-[#3B446A] tracking-wider truncate">
                      {currentWallet?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-[var(--font-bricolage-grotesque)] text-xs text-black opacity-60 leading-none truncate">
                        {currentWallet?.address?.slice(0, 4) + "..." + currentWallet?.address?.slice(-4)}
                      </span>
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <CopyButton text={currentWallet?.address} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow down icon */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-5 h-5 flex-shrink-0 ml-2"
                >
                  <Image
                    src="/dropdown-icons/arrow-down.svg"
                    alt="Arrow Down"
                    width={12}
                    height={12}
                    className={`text-[#3B446A] transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full gap-2">
                <span className="text-center text-white font-medium text-sm">
                  Connect
                </span>
                <Image
                  src="/dropdown-icons/arrow-down.svg"
                  alt="Arrow Down"
                  width={12}
                  height={12}
                  className={`text-white transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center w-full">
              <span className="text-center text-white font-medium text-sm">
                Loading...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DROPDOWN */}
      {isDropdownOpen && (
        <div
          data-state={isDropdownOpen ? "open" : "closed"}
          className="absolute top-full right-0 w-full rounded-b-[12px] shadow-lg overflow-hidden z-10 origin-top-right data-[state=closed]:pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
          style={{
            ...backgroundStyle,
            boxShadow: "0px 4px 20px 0px rgba(96, 167, 255, 0.25)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-full">
            {!loggedIn ? (
              /* Wallet selection menu */
              <div className="w-full">
                {/* EVM Wallet */}
                <button
                  onClick={handleEVMConnect}
                  className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="font-[var(--font-bricolage-grotesque)] text-xs text-black">
                    EVM Wallet
                  </span>
                </button>

                {/* Polkadot Wallet */}
                <button
                  onClick={handlePolkadotConnect}
                  className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span className="font-[var(--font-bricolage-grotesque)] text-xs text-black">
                    Polkadot Wallet
                  </span>
                </button>
              </div>
            ) : (
              /* Connected wallet menu */
              <div className="w-full">
                {/* Profile */}
                <button
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <Image
                    src="/dropdown-icons/profile-icon.svg"
                    alt="Profile"
                    width={20}
                    height={20}
                  />
                  <span className="font-[var(--font-bricolage-grotesque)] text-xs text-black">
                    Profile
                  </span>
                </button>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <Image
                    src="/dropdown-icons/logout-icon.svg"
                    alt="Disconnect"
                    width={20}
                    height={20}
                  />
                  <span className="font-[var(--font-bricolage-grotesque)] text-xs text-[#FF4560]">
                    Disconnect
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
