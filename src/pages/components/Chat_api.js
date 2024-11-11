/* Attempt to build the chat function based on direct api callm */

import { useState, useEffect, useRef } from "react";
import Image from "next/image"; // Assuming you're using Next.js for the Image component
import { main } from "./langflow.js"; // Import main function from langflow.js

const MyChatComponent = () => {
  const [messages, setMessages] = useState([]); // Initial message array, can be empty
  const [input, setInput] = useState("");

  const chatContainer = useRef(null);

  const scroll = () => {
    if (chatContainer.current) {
      const { offsetHeight, scrollHeight, scrollTop } = chatContainer.current;
      if (scrollHeight >= scrollTop + offsetHeight) {
        chatContainer.current.scrollTo(0, scrollHeight + 200);
      }
    }
  };

  useEffect(() => {
    scroll();
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add user message to messages array
    const userMessage = input;
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now(), role: "user", content: userMessage },
    ]);

    try {
      // Get response from langflow.js main function
      const langflowResponse = await main(userMessage);

      // Add AI response from Langflow to messages array
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now(), role: "ai", content: langflowResponse.message },
        { id: Date.now() + 1, role: "ai", content: langflowResponse.warning },
        { id: Date.now() + 2, role: "ai", content: langflowResponse.context },
      ]);
    } catch (error) {
      console.error("Error fetching Langflow response:", error);
    }

    setInput(""); // Clear the input field
  };

  const renderResponse = () => {
    return (
      <div className="response">
        {messages.map((m, index) => (
          <div
            key={m.id}
            className={`chat-line ${
              m.role === "user" ? "user-chat" : "ai-chat"
            }`}
          >
            <Image
              className="avatar"
              alt="avatar"
              width={40}
              height={40}
              src={m.role === "user" ? "/user-avatar.jpg" : "/ai-avatar.png"}
            />
            <div style={{ width: "100%", marginLeft: "16px" }}>
              <p className="message">{m.content}</p>
              {index < messages.length - 1 && (
                <div className="horizontal-line" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div ref={chatContainer} className="chat">
      {renderResponse()}
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          name="input-field"
          type="text"
          placeholder="Say anything"
          onChange={handleInputChange}
          value={input}
        />
        <button type="submit" className="send-button" />
      </form>
    </div>
  );
};

export default MyChatComponent;
