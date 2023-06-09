import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Head from "next/head";
import { enqueueSnackbar } from "notistack";
import { ethers } from "ethers";
import {
  useAccount,
  useContract,
  useNetwork,
  useSigner,
  useSignMessage,
  useSwitchNetwork,
} from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import { useWeb3Modal } from "@web3modal/react";

import ReferralAccessModal from "components/Modal/ExplanationModal";
import NftResponseModal from "components/Modal/NftResponseModal";
import Timer from "components/Timer";
import Loader from "react-loaders";

import salesAbi from "assets/sales-abi.json";
import nftAbi from "assets/nft-abi.json";
import { inspect } from "util";

import s from "styles/home.module.scss";

const SALES_CONTRACT_ADDRESS = "0x7ba75866bF445b476b1004D0e41BD1749E0cb1CF";
const NFT_CONTRACT_ADDRESS = "0x25bf876880A40b77F51F878470C9Ca1c67F7fd4a";

const REACT_APP_API_ENDPOINT = "https://trace-core.flamma.app";

const CONFIRMATIONS_COUNT = 10;

const CURRENT_CHAIN_ID = polygonMumbai.id; // TODO: изменить на polygon.id при релизе на продакшн

const STAGE: "start" | "public" | "everyone" = "start";

export default function Home() {
  const [isInitial, setIsInitial] = useState(true);
  const [referralModalOpen, setReferralModalOpen] = useState<boolean>(false);
  const [nftModalOpen, setNftModalOpen] = useState<boolean>(false);
  const [isWhiteListed, setIsWhiteListed] = useState<boolean>(false);
  const [isWhiteListLoading, setIsWhiteListedLoading] =
    useState<boolean>(false);
  const [isServerAnswered, setIsServerAnswered] = useState<boolean>(false);
  const [isConfirmationWaiting, setIsConfirmationWaiting] = useState(false);

  const [count, setCount] = useState<string>();

  const { open } = useWeb3Modal();
  const { data: signer } = useSigner();

  const { address } = useAccount();

  const { chain } = useNetwork();

  const { switchNetwork } = useSwitchNetwork();

  const { signMessageAsync } = useSignMessage();

  const salesContractInstance = useContract({
    address: SALES_CONTRACT_ADDRESS,
    abi: salesAbi,
    signerOrProvider: signer,
  });

  const nftContactInstance = useContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    signerOrProvider: signer,
  });

  const getNFTCount = async () => {
    if (address === undefined) throw new Error("Address does not exist");
    const response = await nftContactInstance?.balanceOf(address);
    return response?.toString(); // '0' | '1' | '2'
  };

  const isInitializing =
    address === undefined ||
    chain === undefined ||
    switchNetwork === undefined ||
    signer === undefined;

  const isButtonEnabled = useMemo<boolean>(() => {
    if (STAGE === "everyone") {
      if (count === undefined) return false;
      if (count === "2" && isWhiteListed) return false;
      if (count === "1" && !isWhiteListed) return false;
      return true;
    } else if (STAGE === "public") {
      if (count === undefined) return false;
      if ((count === "1" || count === "2") && isWhiteListed) return false;
      if (!isWhiteListed) return false;
      return true;
    } else {
      return false;
    }
  }, [count, isWhiteListed]);

  useEffect(() => {
    if (isInitializing) return;

    const initialize = async () => {
      try {
        if (chain?.id !== CURRENT_CHAIN_ID) {
          switchNetwork(CURRENT_CHAIN_ID);
        } else {
          const nftCount = await getNFTCount();
          setCount(nftCount);
        }
      } catch (error: any) {
        enqueueSnackbar({
          variant: "trace",
          customTitle: "Error",
          customMessage: error?.message,
          type: "error",
        });
      }
    };

    initialize();
  }, [isInitializing]);

  const generateSignature = async () => {
    if (address === undefined) throw new Error("Address does not exist");
    const message = ethers.utils.keccak256(ethers.utils.arrayify(address));
    const signature = await signMessageAsync({
      message: ethers.utils.arrayify(message),
    });
    return ethers.utils.splitSignature(signature);
  };

  const purchaseToken = async () => {
    setIsConfirmationWaiting(true);
    const { wait } = await salesContractInstance?.purchaseToken();
    enqueueSnackbar({
      variant: "trace",
      customTitle: "Processing",
      customMessage: "Awaiting confirmation...",
      type: "default",
    });
    await wait(CONFIRMATIONS_COUNT);
    setNftModalOpen(true);
    setIsConfirmationWaiting(false);
    const nftCount = await getNFTCount();
    setCount(nftCount);
  };

  const purchaseTokenWhitelisted = async () => {
    setIsConfirmationWaiting(true);
    const { r, s, v } = await generateSignature();
    const { wait } = await salesContractInstance?.purchaseTokenWhiteListed(
      r,
      s,
      v
    );
    enqueueSnackbar({
      variant: "trace",
      customTitle: "Processing",
      customMessage: "Awaiting confirmation...",
      type: "default",
    });
    await wait(CONFIRMATIONS_COUNT);
    setNftModalOpen(true);
    setIsConfirmationWaiting(false);
    const nftCount = await getNFTCount();
    setCount(nftCount);
  };

  const handleMint = async () => {
    try {
      if (!isButtonEnabled) {
        if (STAGE === "start") {
          enqueueSnackbar({
            variant: "trace",
            customTitle: "Sorry...",
            customMessage:
              "Mint hasn't started yet. Please stay tuned for updates.",
            type: "error",
          });
        } else if (
          STAGE === "everyone" ||
          (STAGE === "public" && isWhiteListed)
        ) {
          enqueueSnackbar({
            variant: "trace",
            customTitle: "Oops!",
            customMessage: "Minting more NFT Passes is currently unavailable.",
            type: "error",
          });
        } else if (!isWhiteListed && STAGE === "public") {
          enqueueSnackbar({
            variant: "trace",
            customTitle: "Sorry...",
            customMessage:
              "Your wallet is not on the Whitelist. Mint is currently unavailable for you.",
            type: "error",
          });
        } else if (!isWhiteListed) {
          enqueueSnackbar({
            variant: "trace",
            customTitle: "Sorry...",
            customMessage:
              "Mint hasn't started yet. Please stay tuned for updates.",
            type: "error",
          });
        }
        return;
      }
      if (isWhiteListed) purchaseTokenWhitelisted().then();
      else purchaseToken().then();
    } catch (error: any) {
      setIsConfirmationWaiting(false);
      enqueueSnackbar({
        variant: "trace",
        customTitle: "Error",
        customMessage: error?.message,
        type: "error",
      });
    }
  };

  const closeReferralModal = () => {
    setReferralModalOpen(false);
  };
  const closeNftModal = () => {
    setNftModalOpen(false);
  };

  const checkWhiteList = async () => {
    setIsWhiteListedLoading(true);
    try {
      const response = await fetch(`${REACT_APP_API_ENDPOINT}/white-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: address }),
      });
      if (!response.ok) {
        throw new Error("Server error");
      }
      const data = await response.json();
      if (data.result) {
      // if (true) {
        setIsWhiteListed(data.result);
        // setIsWhiteListed(true);
        enqueueSnackbar({
          variant: "trace",
          customTitle: "Server response",
          customMessage: "You are in whitelist!",
          type: "correct",
        });
      } else {
        enqueueSnackbar({
          variant: "trace",
          customTitle: "Server response",
          customMessage: "You are not in whitelist",
        });
      }
      setIsServerAnswered(true);
    } catch (error: any) {
      enqueueSnackbar({
        variant: "trace",
        customTitle: "Error",
        customMessage: error?.message,
        type: "error",
      });
    } finally {
      setIsWhiteListedLoading(false);
    }
  };

  function windowWidth() {
    const number = `${document.documentElement.clientWidth}px`;
    document.documentElement.style.setProperty("--window-width", number);
  }

  useEffect(() => {
    windowWidth();
    window.onresize = windowWidth;
  }, []);

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }
    enqueueSnackbar({
      variant: "trace",
      customTitle: "Congratulations!",
      customMessage: "Wallet has been connected",
      type: "correct",
    });
  }, [address]);

  return (
    <>
      <Head>
        <title>MetaTrace</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="" />
      </Head>
      <main className={s.main}>
        <div className={s.container}>
          <div className={s.firstPart}>
            <header className={s.header}>
              <div className={s.logoWrapper}>
                <Image
                  src="/images/logo.svg"
                  fill
                  alt=""
                  style={{ objectFit: "cover" }}
                />
              </div>
              {/* <button className={s.languageBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" className={s.planetSvg} viewBox="0 0 27 27">
                  <path fill="#6B7A99" fillRule="evenodd" clipRule="evenodd" fillOpacity=".5" d="M13.5 2.25c-1.334 0-2.765 1.903-3.647 4.91a.564.564 0 0 0 .545.715h6.204a.564.564 0 0 0 .546-.714C16.265 4.153 14.834 2.25 13.5 2.25Zm-4.425.91a11.29 11.29 0 0 0-4.938 4.128c-.165.249.022.587.321.587h2.213c.48 0 .695-.184.756-.437.398-1.662.96-3.11 1.648-4.278Zm8.85 0c.688 1.169 1.25 2.617 1.648 4.278.061.253.285.437.545.437h2.42c.299 0 .49-.338.325-.587a11.29 11.29 0 0 0-4.938-4.128ZM3.06 10.125a.388.388 0 0 0-.374.275 11.242 11.242 0 0 0 0 6.2.388.388 0 0 0 .374.275h3.274a.556.556 0 0 0 .553-.615 27.985 27.985 0 0 1 0-5.52.556.556 0 0 0-.553-.615H3.059Zm6.67 0a.564.564 0 0 0-.564.492A25.097 25.097 0 0 0 9 13.5c0 1.005.059 1.97.165 2.883a.564.564 0 0 0 .564.492h7.541a.564.564 0 0 0 .565-.492c.106-.914.165-1.878.165-2.883 0-1.005-.059-1.97-.165-2.883a.564.564 0 0 0-.565-.492H9.73Zm10.939 0a.556.556 0 0 0-.554.615 28 28 0 0 1 0 5.52c-.033.33.22.615.553.615h3.274a.388.388 0 0 0 .374-.275 11.241 11.241 0 0 0 0-6.2.388.388 0 0 0-.374-.275h-3.273Zm-16.205 9c-.3 0-.49.338-.326.587a11.29 11.29 0 0 0 4.938 4.128c-.688-1.168-1.25-2.617-1.648-4.278a.566.566 0 0 0-.545-.437h-2.42Zm5.935 0a.564.564 0 0 0-.545.714c.882 3.008 2.313 4.911 3.647 4.911 1.334 0 2.765-1.903 3.648-4.91a.564.564 0 0 0-.546-.715h-6.204Zm9.931 0c-.48 0-.695.184-.756.437-.398 1.662-.96 3.11-1.648 4.278a11.29 11.29 0 0 0 4.938-4.128c.165-.249-.022-.587-.321-.587h-2.213Z"/>
                </svg>
                <span>
                  en
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={s.arrowSvg}  fill="none" viewBox="0 0 10 6">
                  <path fill="#647788" fillRule="evenodd" d="M8.709.794 5.172 4.212 1.636.794a.496.496 0 0 0-.686 0 .457.457 0 0 0 0 .662l3.88 3.75c.19.183.496.183.685 0l3.88-3.75a.457.457 0 0 0 0-.662.496.496 0 0 0-.686 0Z" clipRule="evenodd"/>
                </svg>
              </button> */}
            </header>
            <h1 className={s.tittle}>
              UPCOMING FREE MINT NFT pass
              <span style={{ color: "rgba(255, 165, 59, 1)" }}> metatRACE</span>
            </h1>
            <Timer />
            <div className={s.cubeWrapper}>
              <Image
                src="/images/cube.gif"
                fill
                alt=""
                style={{ objectFit: "cover" }}
                className={s.cubeImg}
              />
              <div className={s.line} />
            </div>
            <div className={s.nftPanel}>
              <div className={s.nftBlock}>
                <span>total: </span>
                <span className={s.nftAmount}>3000 NFT</span>
              </div>
              {!address && (
                <button
                  className={s.whitelist + " " + s.btnConnect}
                  onClick={() => open()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={s.foxSvg}
                    fill="none"
                    viewBox="0 0 23 22"
                  >
                    <path
                      fill="#fff"
                      d="m2.015.992 7.981 6.522-2.992 2.989-4.98 1.493L.487 15.5l7.518.012-.475 4.497 2.016 1.503h3.95l2.003-1.503-.486-4.506 7.494-.009-1.494-3.463-5.065-1.533-2.933-2.984 7.98-6.522-7.014 2.514H8.953L2.015.992Zm19.497.867-6.867 5.637 1.851 2.11 4.488 1.382 1.506-6.006-.978-3.123ZM1.52 1.871.523 5.023l1.489 5.965L6.46 9.611l1.892-2.115L1.52 1.871ZM9 13l1 1.5-2.521-.482L9 13Zm5 0 1.512 1.018L13 14.5l1-1.5ZM.5 16.496l1.512 4.518 4.476-1.005.404-3.488L.5 16.497Zm15.615.009.393 3.504 4.47 1.005 1.512-4.5-6.375-.01ZM10.403 17h2.176l.421.5.016 1.51-3.024-.018L10 17.5l.403-.5Z"
                    />
                  </svg>
                  <span>connect wallet</span>
                </button>
              )}
              {!isServerAnswered && address && (
                <button
                  className={s.whitelist + " " + s.btnGet}
                  onClick={checkWhiteList}
                >
                  {!isWhiteListLoading && (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={s.discordSvg}
                        fill="none"
                        viewBox="0 0 28 20"
                      >
                        <path
                          fill="#fff"
                          d="M24.067 2.533C22.177.933 19.91.133 17.515 0l-.378.4c2.142.533 4.032 1.6 5.796 3.067A18.42 18.42 0 0 0 15.877 1.2c-.756-.133-1.386-.133-2.142-.133s-1.386 0-2.142.133a18.42 18.42 0 0 0-7.057 2.267C6.3 2 8.19.933 10.332.4L9.954 0C7.56.133 5.292.933 3.402 2.533 1.26 6.8.126 11.6 0 16.533 1.89 18.667 4.536 20 7.308 20c0 0 .882-1.067 1.512-2-1.638-.4-3.15-1.333-4.158-2.8.882.533 1.764 1.067 2.646 1.467 1.134.533 2.268.8 3.402 1.066 1.009.134 2.017.267 3.025.267s2.016-.133 3.024-.267c1.134-.266 2.268-.533 3.402-1.066.882-.4 1.764-.934 2.646-1.467-1.008 1.467-2.52 2.4-4.158 2.8.63.933 1.512 2 1.512 2 2.772 0 5.418-1.333 7.308-3.467-.126-4.933-1.26-9.733-3.402-14Zm-14.49 11.6c-1.26 0-2.395-1.2-2.395-2.666C7.182 10 8.316 8.8 9.576 8.8c1.26 0 2.395 1.2 2.395 2.667 0 1.466-1.135 2.666-2.395 2.666Zm8.316 0c-1.26 0-2.394-1.2-2.394-2.666 0-1.467 1.134-2.667 2.394-2.667 1.26 0 2.394 1.2 2.394 2.667 0 1.466-1.134 2.666-2.394 2.666Z"
                        />
                      </svg>
                      <span>Get whitelist</span>
                    </>
                  )}
                  {isWhiteListLoading && (
                    <div className={s.loaderWrapper}>
                      <Loader type="line-scale-pulse-out-rapid" active />
                    </div>
                  )}
                </button>
              )}
              {isServerAnswered && address && !isButtonEnabled && (
                <button
                  className={s.whitelist + " " + s.btnMintClose}
                  onClick={handleMint}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={s.lockSvg}
                    fill="none"
                    viewBox="0 0 24 32"
                  >
                    <path
                      fill="#647788"
                      fillOpacity=".5"
                      d="M23.333 12h-2V9.333C21.333 4.187 17.147 0 12 0 6.854 0 2.667 4.187 2.667 9.333V12h-2a.666.666 0 0 0-.667.667v16.666A2.67 2.67 0 0 0 2.667 32h18.666A2.67 2.67 0 0 0 24 29.333V12.667a.666.666 0 0 0-.667-.667Zm-9.757 10.145.42 3.781a.668.668 0 0 1-.663.74h-2.666a.667.667 0 0 1-.663-.74l.42-3.781A2.637 2.637 0 0 1 9.335 20 2.67 2.67 0 0 1 12 17.333 2.67 2.67 0 0 1 14.667 20c0 .862-.409 1.648-1.091 2.145ZM17.332 12H6.667V9.333A5.34 5.34 0 0 1 12 4a5.34 5.34 0 0 1 5.333 5.333V12Z"
                    />
                  </svg>
                  <span>Mint</span>
                </button>
              )}
              {isServerAnswered && address && isButtonEnabled && (
                <button
                  className={s.whitelist + " " + s.btnMintOpen}
                  onClick={handleMint}
                  disabled={isConfirmationWaiting}
                >
                  {!isConfirmationWaiting && <span>Mint</span>}

                  {isConfirmationWaiting && (
                    <div className={s.loaderWrapper}>
                      <Loader type="line-scale-pulse-out-rapid" active />
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            className={s.descriptionBtn}
            onClick={() => setReferralModalOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={s.questionSvg}
              fill="none"
              viewBox="0 0 25 25"
            >
              <path
                fill="#647788"
                fillOpacity=".5"
                fillRule="evenodd"
                d="M12.5 25C19.404 25 25 19.404 25 12.5S19.404 0 12.5 0 0 5.596 0 12.5 5.596 25 12.5 25Zm-1.64-9.502h2.802c.013-.514.088-.94.225-1.28.136-.344.394-.683.771-1.015.436-.403.83-.781 1.182-1.133a4.54 4.54 0 0 0 .85-1.152c.214-.417.322-.905.322-1.465 0-.84-.183-1.546-.547-2.119-.365-.58-.889-1.016-1.572-1.309-.684-.293-1.501-.44-2.452-.44-.859 0-1.637.144-2.334.43-.69.28-1.243.727-1.66 1.339-.41.605-.625 1.393-.644 2.363h3.31c.013-.378.082-.68.205-.908.124-.235.284-.407.479-.518a1.32 1.32 0 0 1 .644-.166c.28 0 .511.055.694.166a.95.95 0 0 1 .42.479c.097.214.146.491.146.83 0 .273-.058.53-.176.771-.117.241-.286.479-.507.713a8.957 8.957 0 0 1-.791.732c-.345.3-.619.625-.82.977a3.81 3.81 0 0 0-.43 1.191 8.66 8.66 0 0 0-.118 1.514Zm.107 1.797a1.529 1.529 0 0 0-.508 1.172c0 .469.17.862.508 1.181.338.313.778.47 1.318.47s.98-.157 1.319-.47c.338-.319.507-.712.507-1.181 0-.469-.169-.86-.508-1.172-.338-.32-.777-.479-1.318-.479-.54 0-.98.16-1.318.479Z"
                clipRule="evenodd"
              />
            </svg>
            <span className={s.text}>How it works?</span>
          </button>
          <div className={s.secondPart}>
            <div className={s.empty} />
            <div className={s.textPart}>
              <h2 className={s.heading}>
                Only for NFT Pass owners, the following events will open!
              </h2>
              <div className={s.textBlock}>
                <p>
                  It is genesis access to all mechanics and closed events of the
                  TRACE metaverse!
                </p>
                <p>
                  By minting the NFT Pass, you will receive a unique QR code and
                  many amazing perks, including bonus NFT airdrops and draws!
                </p>
                <p>Stay in the center of MetaTrace events</p>
              </div>
            </div>
            <div className={s.footer}>
              <div className={s.logoWrapper + " " + s.desktop}>
                <Image
                  src="/images/logo.svg"
                  fill
                  alt=""
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className={s.infoBlock}>
                <p className={s.desktop}>
                  © 2022 - Copyright by MIXR Lab. All rights reserved.
                </p>
                <div className={s.social}>
                  <a
                    href="https://mixr.gitbook.io/ru/mixr/legal/terms"
                    className={s.link}
                  >
                    Terms of use
                    <div className={s.underline}></div>
                  </a>
                  <a
                    href="https://mixr.gitbook.io/en/mixr/legal/cookie"
                    className={s.link}
                  >
                    Сookie policy
                    <div className={s.underline}></div>
                  </a>
                  <a
                    href="https://mixr.gitbook.io/en/mixr/legal/privacy"
                    className={s.link}
                  >
                    Privacy policy
                    <div className={s.underline}></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/*<Web3Button/>*/}
        </div>

        <ReferralAccessModal
          open={referralModalOpen}
          close={closeReferralModal}
        />
        <NftResponseModal open={nftModalOpen} close={closeNftModal} />
        {/*<button onClick={handleMint}>SSSSSS</button>*/}
      </main>
    </>
  );
}
