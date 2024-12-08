import React, { useState, useEffect, useMemo, useRef } from "react";
import { AiOutlineSend, AiFillDelete, AiOutlineCopy } from "react-icons/ai"; // Added Copy Icon
import { firestore, auth } from "./Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FiLogOut } from "react-icons/fi"; // Logout Icon
import { isToday, isYesterday } from "date-fns";

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [longPressTimer, setLongPressTimer] = useState(null);
  const userUID = auth.currentUser?.uid;
  const navigate = useNavigate();
  const textareaRef = useRef(null); // Create a reference for the textarea
  let lastDate = null;

  // For now, use a static chatId
  const chatId = "user1_user2";

  const messagesRef = useMemo(() => {
    return collection(firestore, "chats", chatId, "messages");
  }, [chatId]);

  useEffect(() => {
    if (!messagesRef) return;

    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const loadedMessages = [];
        querySnapshot.forEach((doc) => {
          loadedMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(loadedMessages);
      },
      (error) => {
        console.error("Error fetching messages: ", error);
      }
    );

    return () => unsubscribe();
  }, [messagesRef]);

  // Resize the textarea when content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to shrink the textarea when content is removed
      textarea.style.height = "auto";
      // Set the height based on scrollHeight (content height)
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]); // This effect runs every time the input changes

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      text: input.trim(),
      sender: userUID,
      timestamp: serverTimestamp(), // Timestamp is set in Firestore, so we send a placeholder
    };

    // Optimistically update the UI with the new message
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: "temp-id", ...newMessage },
    ]);

    try {
      // Send the message to Firestore
      const docRef = await addDoc(messagesRef, newMessage);

      // Update the message with the Firestore document ID (and actual timestamp)
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === "temp-id"
            ? { ...msg, id: docRef.id, timestamp: { toDate: () => new Date() } }
            : msg
        )
      );

      setInput(""); // Clear input field after sending the message
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return "Sending..."; // Handle null or undefined timestamp

      // Check if it's a Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : timestamp;

      if (!(date instanceof Date)) {
        console.error("Invalid date format", timestamp);
        return "Invalid Time";
      }

      return format(date, "hh:mm a");
    } catch (error) {
      console.error("Error formatting timestamp: ", error);
      return "Invalid Time";
    }
  };

  const getDateLabel = (timestamp) => {
    // Check if timestamp is null or missing
    if (!timestamp || !timestamp.toDate) {
      return "Loading..."; // Fallback message while timestamp is loading
    }

    const date = timestamp.toDate();
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "dd MMM yyyy");
  };

  const handleLongPress = (msgId, e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    setLongPressTimer(
      setTimeout(() => {
        setSelectedMessages((prev) => {
          const newSelectedMessages = new Set(prev);
          if (newSelectedMessages.has(msgId)) {
            newSelectedMessages.delete(msgId); // Deselect message if already selected
          } else {
            newSelectedMessages.add(msgId); // Select message
          }
          return newSelectedMessages;
        });
      }, 500) // Trigger long press after 500ms
    );
  };

  const handleMouseUp = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  const handleDelete = async () => {
    try {
      // Create a batch instance
      const batch = writeBatch(firestore);

      // Add delete operations for each selected message
      selectedMessages.forEach((msgId) => {
        const messageDocRef = doc(
          firestore,
          "chats",
          chatId,
          "messages",
          msgId
        );
        batch.delete(messageDocRef);
      });

      // Commit the batch operation
      await batch.commit();

      // Optimistically update the UI
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !selectedMessages.has(msg.id))
      );

      // Clear selected messages
      setSelectedMessages(new Set());
    } catch (error) {
      console.error("Error deleting messages: ", error);
    }
  };

  const copyMessageToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setSelectedMessages(new Set());
      },
      (err) => {
        console.error("Error copying message: ", err);
      }
    );
  };

  return (
    <div className="flex flex-col h-[92.5vh] bg-gray-900 text-white overflow-hidden">
      <div>
        {/* Add Tailwind's transition utility classes */}
        <style>
          {`
            .fade-in {
              animation: fadeIn 0.5s ease-in-out;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(50px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .scale-on-select {
              transition: transform 0.2s, box-shadow 0.2s;
            }

            .scale-on-select:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            .no-select {
              user-select: none; /* Prevents text selection */
            }
          `}
        </style>
      </div>

      <header className="py-4 text-lg font-semibold bg-gray-800">
        <h1 className="text-gray-200 text-2xl ml-5">
          Hello,{" "}
          {userUID === "ZyQCmlgKlxfvIDhWj4dassKE2uR2"
            ? "Zohaib"
            : userUID === "PWYURR3dZoS1pF5hRSRhEctHDSM2"
            ? "Shanza"
            : "DumyUser"}{" "}
          👋
        </h1>
      </header>

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center transition-all"
      >
        <FiLogOut size={18} />
      </button>

      <div
        onClick={() => setSelectedMessages(new Set())}
        className="no-select flex-1 max-w-full overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, index) => {
            // Safeguard against invalid timestamp
            const timestamp =
              msg.timestamp && msg.timestamp.toDate
                ? msg.timestamp.toDate()
                : null;

            const currentDate = timestamp ? timestamp.toDateString() : null; // Use valid timestamp
            const showDateLabel = currentDate && currentDate !== lastDate; // Only show date label if it's different
            lastDate = currentDate;

            return (
              <React.Fragment key={msg.id}>
                {/* Date Separator */}
                {showDateLabel && (
                  <div className="flex justify-center my-4">
                    <span className="px-4 py-2 bg-gray-800 text-gray-400 rounded-full text-xs">
                      {getDateLabel(msg.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message Display */}
                <div
                  className={`flex ${
                    msg.sender === userUID ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    onMouseDown={(e) => handleLongPress(msg.id, e)}
                    onMouseUp={handleMouseUp}
                    onTouchStart={(e) => handleLongPress(msg.id, e)}
                    onTouchEnd={handleMouseUp}
                    className={`max-w-xs min-w-16 max-h-auto text-wrap px-4 pb-8 py-3 rounded-lg relative overflow-auto ${
                      msg.sender === userUID
                        ? "bg-blue-600 text-white rounded-se-none"
                        : "bg-gray-700 text-gray-100 rounded-tl-none"
                    } ${
                      selectedMessages.has(msg.id)
                        ? "bg-blue-800 m-auto border border-blue-200 scale-on-select rounded=-lg rounded-se-lg rounded-tl-lg"
                        : ""
                    }`}
                    style={{
                      whiteSpace: "pre-wrap", // Ensure text wraps
                      wordWrap: "break-word", // Prevents overflow
                      overflowWrap: "break-word", // Prevents long words from breaking out
                    }}
                  >
                    {msg.text}
                    <span className="text-xs text-gray-400 min-w-max absolute bottom-1 right-2">
                      {formatTimestamp(timestamp)}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <textarea
            ref={textareaRef} // Attach the ref to the textarea
            value={input}
            onChange={handleInputChange}
            className="bg-gray-700 text-white p-3 rounded-md resize-none outline-none"
            placeholder="Type your message..."
            rows={1} // Start with a single row height
            style={{
              overflow: "hidden", // Prevent scrollbars from appearing
              minHeight: "40px", // Minimum height
              maxHeight: "200px", // Limit max height
              width: "100%",
            }}
          />
          <button type="submit" className="bg-blue-600 p-3 rounded-full">
            <AiOutlineSend size={22} />
          </button>
        </form>

        {/* Actions */}
        {selectedMessages.size > 0 && (
          <div
            className={`${
              selectedMessages.size !== 1 ? "mr-36" : ""
            } mr-28 flex justify-end space-x-3 mt-3`}
          >
            <button
              onClick={handleDelete}
              className="bg-red-600 p-2 rounded-full hover:bg-red-700"
            >
              <AiFillDelete size={20} />
            </button>
            <button
              className={`${
                selectedMessages.size === 1 ? "" : "hidden"
              } bg-blue-600 p-2 rounded-full hover:bg-blue-700`}
              onClick={() =>
                copyMessageToClipboard(
                  messages
                    .filter((msg) => selectedMessages.has(msg.id))
                    .map((msg) => msg.text)
                    .join("\n")
                )
              }
            >
              <AiOutlineCopy size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatApp;
