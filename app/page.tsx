"use client";
import Head from "next/head";
import Image from "next/image";
import localFont from "next/font/local";
import styles from "./styles/Home.module.css";
import Chat from "./components/Chat";
import React, { useState } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  const [isChatVisible, setIsChatVisible] = useState(false);

  if (isChatVisible) {
    return (
      <div className="myDiv">
        <Head>
          <title>TrustRAG</title>
          <meta name="description" content="Generated by create next app" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <aside className="sidemenu">
          <div style={{ height: "20px" }}></div>
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={50}
            height={50}
            style={{ fill: "rgba(0, 0, 0, 0.9)" }}
            onClick={() => setIsChatVisible(!isChatVisible)}
          />{" "}
          <p>
            <span style={{ color: "rgba(0, 0, 0, 0.5)" }}>VERA</span>
          </p>
          <div style={{ height: "20px" }}></div>
          <div className="new-textbook">
            <span>+ </span>NEW TEXTBOOK
          </div>
        </aside>
        <div
          className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
        >
          <main className={styles.main}>
            <div className="flex-grow overflow-hidden">
              <Chat />
            </div>
          </main>
          <footer className={styles.footer}></footer>
        </div>
      </div>
    );
  } else {
    return (
      <div className="myDiv">
        <Head>
          <title>TrustRAG</title>
          <meta name="description" content="Generated by create next app" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <aside className="sidemenu">
          <div style={{ height: "20px" }}></div>
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={50}
            height={50}
            style={{ fill: "rgba(0, 0, 0, 0.9)" }}
          />{" "}
          <p>
            <span style={{ color: "rgba(0, 0, 0, 0.5)" }}>VERA</span>
          </p>
          <div style={{ height: "20px" }}></div>
          <div className="new-textbook">
            <span>+ </span>NEW TEXTBOOK
          </div>
        </aside>
        <div
          className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
        >
          <main className={styles.main}>
            <ol>
              <h1>Hey!</h1>
              <h1>Chat with VERA.</h1>
              <br></br>
              <h3>
                Verifiable and Explainable Retrieval-Augmented Generation.
              </h3>
              <br></br>
              <li>
                Upload your textbook PDF you’d like to use. The system will
                automatically process the text to make it ready for
                question-answering.
              </li>
              <li>
                Ask a question on the textbook content. The system will retrieve
                relevant sections from the textbook and generate an answer based
                on the retrieved information.
              </li>
              <li>
                Check for any warnings next to the generated answer. They
                indicate potential issues, such as biased content or
                hallucinations, ensuring you get the most accurate answer!
              </li>
            </ol>

            <div className={styles.ctas}>
              <a
                className={styles.primary}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsChatVisible(!isChatVisible)}
              >
                <Image
                  className={styles.logo}
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={20}
                  height={20}
                />
                Let's Go
              </a>
              {/* <a
                className={styles.primary}
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className={styles.logo}
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={20}
                  height={20}
                />
                Deploy now
              </a>
              <a
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondary}
              >
                Read our docs
              </a> */}
            </div>
          </main>
          <footer className={styles.footer}>
            {/* <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Learn
            </a>
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Examples
            </a>
            <a
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            ></a> */}
          </footer>
        </div>
      </div>
    );
  }
}
