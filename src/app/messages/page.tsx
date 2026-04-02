"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useAuthStore } from "@/store/authStore";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

interface LastMessage {
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherParticipant: Participant | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  orderId?: string;
  productId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  content: string;
  contentType:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "location"
    | "contact"
    | "product"
    | "order";
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  documentName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  product?: {
    id: string;
    title: string;
    price: number;
    image?: string;
    slug: string;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
  } | null;
  status: "sending" | "sent" | "delivered" | "read";
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  readBy: string[];
  editedAt?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  createdAt: string;
}

function MessagesPageContent() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get("store");
  const conversationId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [showSellerSearch, setShowSellerSearch] = useState(false);
  const [sellerSearchQuery, setSellerSearchQuery] = useState("");
  const [sellerSearchCategory, setSellerSearchCategory] = useState("");
  const [sellerSearchResults, setSellerSearchResults] = useState<any[]>([]);
  const [sellerSearchLoading, setSellerSearchLoading] = useState(false);
  const [sellerSearchPage, setSellerSearchPage] = useState(1);
  const [sellerSearchTotalPages, setSellerSearchTotalPages] = useState(1);
  const [startingConversation, setStartingConversation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Menu and modal states
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSearchMessages, setShowSearchMessages] = useState(false);
  const [showSelectMessages, setShowSelectMessages] = useState(false);
  const [showMuteNotifications, setShowMuteNotifications] = useState(false);
  const [showDisappearingMessages, setShowDisappearingMessages] =
    useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showClearChat, setShowClearChat] = useState(false);
  const [showDeleteChat, setShowDeleteChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [disappearingMessagesEnabled, setDisappearingMessagesEnabled] =
    useState(false);
  const [disappearingMessagesDuration, setDisappearingMessagesDuration] =
    useState("off");
  const [searchMessagesQuery, setSearchMessagesQuery] = useState("");
  const [searchMessagesResults, setSearchMessagesResults] = useState<Message[]>(
    [],
  );
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [reportReason, setReportReason] = useState("");

  async function createConversationWithSeller(storeSlug: string) {
    try {
      setStartingConversation(true);

      // First get seller details
      const sellerResponse = await fetch(`/api/stores/${storeSlug}`);
      if (!sellerResponse.ok) {
        console.error("Seller not found");
        return;
      }

      const sellerData = await sellerResponse.json();
      if (!sellerData.success) {
        console.error("Failed to get seller details");
        return;
      }

      const seller = sellerData.data.store;
      const sellerUser = sellerData.data.user;

      // Create conversation
      const token = localStorage.getItem("token");
      const createResponse = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: sellerUser.id,
          initialMessage: `Hi, I'm interested in your products. Can we chat?`,
        }),
      });

      const createData = await createResponse.json();
      if (createData.success) {
        // Add new conversation to list
        const newConversation: Conversation = {
          id: createData.conversationId,
          otherParticipant: {
            id: sellerUser.id,
            name: seller.name,
            avatar: seller.logo,
            email: sellerUser.email,
          },
          lastMessage: {
            content: `Hi, I'm interested in your products. Can we chat?`,
            senderId: user?.id || "",
            senderName: user?.displayName || "",
            createdAt: new Date().toISOString(),
          },
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setShowMobileConversations(false);
      }
    } catch (err) {
      console.error("Error creating conversation with seller:", err);
    } finally {
      setStartingConversation(false);
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Track when store has hydrated
  useEffect(() => {
    if (isHydrated) {
      setHasHydrated(true);
    }
  }, [isHydrated]);

  // Fetch conversations - wait for hydration before loading
  useEffect(() => {
    // Don't start until store has hydrated
    if (!hasHydrated) {
      return;
    }

    async function fetchConversations() {
      // First check if we have a token in localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setInitialLoadDone(true);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/messages/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          // Also save to localStorage for backup
          localStorage.setItem(
            "conversations",
            JSON.stringify(data.conversations),
          );
          setConversations(data.conversations);

          // If store slug provided, find or create conversation
          if (storeSlug) {
            // Get seller details first
            try {
              const sellerResponse = await fetch(`/api/stores/${storeSlug}`);
              if (sellerResponse.ok) {
                const sellerData = await sellerResponse.json();
                if (sellerData.success) {
                  const seller = sellerData.data.store;
                  const sellerUser = sellerData.data.user;

                  // Find existing conversation with this seller
                  const existingConv = data.conversations.find(
                    (c: Conversation) =>
                      c.otherParticipant?.id === sellerUser.id,
                  );

                  if (existingConv) {
                    setSelectedConversation(existingConv);
                    setShowMobileConversations(false);
                  } else {
                    // No existing conversation, create one with the seller
                    await createConversationWithSeller(storeSlug);
                  }
                }
              }
            } catch (err) {
              console.error("Error checking for existing conversation:", err);
              // If we can't check, just try to create
              await createConversationWithSeller(storeSlug);
            }
          }

          // If conversation ID provided, find and select that conversation
          if (conversationId) {
            const existingConv = data.conversations.find(
              (c: Conversation) => c.id === conversationId,
            );
            if (existingConv) {
              setSelectedConversation(existingConv);
              setShowMobileConversations(false);
            } else {
              // Conversation not in list, fetch it from API
              try {
                const convResponse = await fetch(
                  `/api/messages/${conversationId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                const convData = await convResponse.json();
                if (convData.success && convData.conversation) {
                  const newConversation: Conversation = {
                    id: convData.conversation._id,
                    otherParticipant: convData.conversation.otherParticipant,
                    lastMessage: convData.conversation.lastMessage,
                    unreadCount: convData.conversation.unreadCount || 0,
                    productId: convData.conversation.productId,
                    orderId: convData.conversation.orderId,
                    createdAt: convData.conversation.createdAt,
                    updatedAt: convData.conversation.updatedAt,
                  };
                  setConversations((prev) => [newConversation, ...prev]);
                  setSelectedConversation(newConversation);
                  setShowMobileConversations(false);
                }
              } catch (err) {
                console.error("Error fetching conversation:", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        // Try loading from localStorage as fallback
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("conversations");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setConversations(parsed);
            } catch {
              // Ignore parse errors
            }
          }
        }
      } finally {
        setLoading(false);
        setInitialLoadDone(true);
      }
    }

    // Always attempt to fetch after hydration
    fetchConversations();
  }, [hasHydrated, storeSlug, conversationId]);

  // Clear localStorage when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("conversations");
    }
  }, [isAuthenticated]);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    // Wait for hydration before setting up SSE
    if (!hasHydrated) return undefined;
    if (!isAuthenticated) return undefined;

    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const eventSource = new EventSource(`/api/messages/ws?token=${token}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "new_message":
            // Add new message to current conversation if it matches
            if (selectedConversation?.id === data.conversationId) {
              setMessages((prev) => [...prev, data.message]);
              scrollToBottom();

              // Mark as read
              markMessagesAsRead(data.conversationId, [data.message.id]);
            }

            // Update conversation list
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id === data.conversationId) {
                  return {
                    ...conv,
                    lastMessage: {
                      content: data.message.content,
                      senderId: data.message.sender?.id || "",
                      senderName: data.message.sender?.name || "",
                      createdAt: data.message.createdAt,
                    },
                    unreadCount:
                      selectedConversation?.id === data.conversationId
                        ? 0
                        : conv.unreadCount + 1,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return conv;
              }),
            );
            break;

          case "typing":
            if (data.conversationId === selectedConversation?.id) {
              setTypingUsers((prev) => {
                const newSet = new Set(prev);
                if (data.isTyping) {
                  newSet.add(data.userId);
                } else {
                  newSet.delete(data.userId);
                }
                return newSet;
              });
            }
            break;

          case "read_receipt":
            if (data.conversationId === selectedConversation?.id) {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (data.messageIds.includes(msg.id)) {
                    return {
                      ...msg,
                      readBy: [...new Set([...msg.readBy, data.readBy])],
                    };
                  }
                  return msg;
                }),
              );
            }
            break;

          case "message_edited":
            if (data.conversationId === selectedConversation?.id) {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === data.messageId) {
                    return {
                      ...msg,
                      content: data.content,
                      editedAt: data.editedAt,
                    };
                  }
                  return msg;
                }),
              );
            }
            break;

          case "message_deleted":
            if (data.conversationId === selectedConversation?.id) {
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== data.messageId),
              );
            }
            break;

          case "message_status":
            if (data.conversationId === selectedConversation?.id) {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === data.messageId) {
                    return {
                      ...msg,
                      status: data.status,
                      deliveredAt:
                        data.status === "delivered"
                          ? data.timestamp
                          : msg.deliveredAt,
                      readAt:
                        data.status === "read" ? data.timestamp : msg.readAt,
                    };
                  }
                  return msg;
                }),
              );
            }
            break;
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
      }, 3000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [hasHydrated, isAuthenticated, selectedConversation]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    // Wait for hydration before fetching
    if (!hasHydrated) return;

    async function fetchMessages() {
      if (!selectedConversation) return;

      try {
        setMessagesLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/messages/${selectedConversation.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setMessagesLoading(false);
      }
    }

    fetchMessages();
  }, [hasHydrated, selectedConversation]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  // Search messages in conversation
  useEffect(() => {
    if (!searchMessagesQuery.trim()) {
      setSearchMessagesResults([]);
      return;
    }
    const results = messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchMessagesQuery.toLowerCase()),
    );
    setSearchMessagesResults(results);
  }, [searchMessagesQuery, messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showMenuDropdown && !target.closest(".relative")) {
        setShowMenuDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuDropdown]);

  async function markMessagesAsRead(
    conversationId: string,
    messageIds: string[],
  ) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/messages/${conversationId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds }),
      });

      // Send read status updates for each message
      if (selectedConversation?.otherParticipant?.id) {
        for (const messageId of messageIds) {
          await fetch("/api/messages/ws", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "message_status",
              conversationId,
              recipientId: selectedConversation.otherParticipant.id,
              data: {
                messageId,
                status: "read",
              },
            }),
          });
        }
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }

  async function handleFileUpload(file: File, contentType: string) {
    if (!selectedConversation || !user) return;

    try {
      setUploading(true);

      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", contentType);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Send message with file
      const messageData: any = {
        content: file.name,
        contentType,
      };

      if (contentType === "image") {
        messageData.imageUrl = uploadData.file.url;
      } else if (contentType === "video") {
        messageData.videoUrl = uploadData.file.url;
      } else if (contentType === "audio") {
        messageData.audioUrl = uploadData.file.url;
      } else if (contentType === "document") {
        messageData.documentUrl = uploadData.file.url;
        messageData.documentName = file.name;
      }

      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();

        // Update conversation last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    content: `Sent a ${contentType}`,
                    senderId: user.id,
                    senderName: user.displayName || "",
                    createdAt: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );

        // Send real-time notification to recipient
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "new_message",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              messageId: data.message.id,
            },
          }),
        });
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setShowMediaMenu(false);
    }
  }

  async function handleShareLocation() {
    if (!selectedConversation || !user) return;

    try {
      // Get current location
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const token = localStorage.getItem("token");

          // Send location message
          const response = await fetch(
            `/api/messages/${selectedConversation.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                content: "Shared a location",
                contentType: "location",
                location: {
                  latitude,
                  longitude,
                },
              }),
            },
          );

          const data = await response.json();

          if (data.success) {
            setMessages((prev) => [...prev, data.message]);
            scrollToBottom();

            // Update conversation last message
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === selectedConversation.id
                  ? {
                      ...conv,
                      lastMessage: {
                        content: "Shared a location",
                        senderId: user.id,
                        senderName: user.displayName || "",
                        createdAt: new Date().toISOString(),
                      },
                      updatedAt: new Date().toISOString(),
                    }
                  : conv,
              ),
            );

            // Send real-time notification to recipient
            const wsToken = localStorage.getItem("token");
            await fetch("/api/messages/ws", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wsToken}`,
              },
              body: JSON.stringify({
                type: "new_message",
                conversationId: selectedConversation.id,
                recipientId: selectedConversation.otherParticipant?.id,
                data: {
                  messageId: data.message.id,
                },
              }),
            });
          }

          setShowMediaMenu(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location");
        },
      );
    } catch (err) {
      console.error("Error sharing location:", err);
      alert("Failed to share location. Please try again.");
    }
  }

  async function handleShareContact() {
    if (!selectedConversation || !user) return;

    // For now, we'll use a simple prompt to get contact details
    // In a real app, you'd have a contact picker modal
    const name = prompt("Enter contact name:");
    if (!name) return;

    const phone = prompt("Enter phone number (optional):");
    const email = prompt("Enter email (optional):");

    try {
      // Send contact message
      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Shared contact: ${name}`,
          contentType: "contact",
          contact: {
            name,
            phone: phone || undefined,
            email: email || undefined,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();

        // Update conversation last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    content: `Shared contact: ${name}`,
                    senderId: user.id,
                    senderName: user.displayName || "",
                    createdAt: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );

        // Send real-time notification to recipient
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "new_message",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              messageId: data.message.id,
            },
          }),
        });
      }

      setShowMediaMenu(false);
    } catch (err) {
      console.error("Error sharing contact:", err);
      alert("Failed to share contact. Please try again.");
    }
  }

  async function handleTyping() {
    if (!selectedConversation || !user) return;

    if (!isTyping) {
      setIsTyping(true);

      // Send typing indicator
      try {
        const token = localStorage.getItem("token");
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "typing",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              userId: user.id,
              isTyping: true,
            },
          }),
        });
      } catch (err) {
        console.error("Error sending typing indicator:", err);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);

      try {
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "typing",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              userId: user.id,
              isTyping: false,
            },
          }),
        });
      } catch (err) {
        console.error("Error sending typing indicator:", err);
      }
    }, 2000);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        const token = localStorage.getItem("token");
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "typing",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              userId: user?.id,
              isTyping: false,
            },
          }),
        });
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          contentType: "text",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        scrollToBottom();
      } else {
        console.error("Failed to send message:", data.error);
        alert(data.error || "Failed to send message");

        // Update conversation last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    content: newMessage,
                    senderId: user?.id || "",
                    senderName: user?.displayName || "",
                    createdAt: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );

        // Send real-time notification to recipient
        const wsToken = localStorage.getItem("token");
        await fetch("/api/messages/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${wsToken}`,
          },
          body: JSON.stringify({
            type: "new_message",
            conversationId: selectedConversation.id,
            recipientId: selectedConversation.otherParticipant?.id,
            data: {
              messageId: data.message.id,
            },
          }),
        });

        // Send delivered status update after a short delay
        setTimeout(async () => {
          try {
            await fetch("/api/messages/ws", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "message_status",
                conversationId: selectedConversation.id,
                recipientId: user?.id,
                data: {
                  messageId: data.message.id,
                  status: "delivered",
                },
              }),
            });
          } catch (err) {
            console.error("Error sending delivered status:", err);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversation(conversation);
    setShowMobileConversations(false);
    setShowSellerSearch(false);

    // Mark as read
    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    }
  }

  async function handleSearchSellers(page: number = 1) {
    if (!sellerSearchQuery && !sellerSearchCategory) {
      setSellerSearchResults([]);
      return;
    }

    try {
      setSellerSearchLoading(true);

      const params = new URLSearchParams();
      if (sellerSearchQuery) params.append("q", sellerSearchQuery);
      if (sellerSearchCategory) params.append("category", sellerSearchCategory);
      params.append("page", page.toString());
      params.append("limit", "20");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/search?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setSellerSearchResults(data.users);
        } else {
          setSellerSearchResults((prev) => [...prev, ...data.users]);
        }
        setSellerSearchPage(data.pagination.page);
        setSellerSearchTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      alert("Failed to search users. Please try again.");
    } finally {
      setSellerSearchLoading(false);
    }
  }

  async function handleStartConversation(seller: any) {
    if (startingConversation) return;

    try {
      setStartingConversation(true);

      // Check if conversation already exists (by user ID or email)
      const existingConv = conversations.find(
        (conv) =>
          conv.otherParticipant?.id === seller.id ||
          conv.otherParticipant?.email === seller.email,
      );

      if (existingConv) {
        handleSelectConversation(existingConv);
        return;
      }

      // Also check if we have a token
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to start a conversation");
        return;
      }

      if (existingConv) {
        handleSelectConversation(existingConv);
        return;
      }

      // Create new conversation
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: seller.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add new conversation to list
        const newConversation: Conversation = {
          id: data.conversationId,
          otherParticipant: {
            id: seller.id,
            name:
              seller.name ||
              seller.displayName ||
              seller.email?.split("@")[0] ||
              "Unknown User",
            email: seller.email,
            avatar: seller.avatar,
          },
          lastMessage: null,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setConversations((prev) => {
          const updated = [newConversation, ...prev];
          localStorage.setItem("conversations", JSON.stringify(updated));
          return updated;
        });
        handleSelectConversation(newConversation);
      } else {
        alert(data.error || "Failed to start conversation");
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setStartingConversation(false);
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getMessageStatusIcon(status: string) {
    switch (status) {
      case "sending":
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
          </svg>
        );
      case "sent":
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "delivered":
        return (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7M5 13l4 4L19 7"
            />
          </svg>
        );
      case "read":
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7M5 13l4 4L19 7"
            />
          </svg>
        );
      default:
        return null;
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    return conv.otherParticipant?.name
      ?.toLowerCase()
      ?.includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to view messages
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access your conversations.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Register
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex overflow-hidden mt-4 md:mt-6">
        {/* Left Panel - Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col ${showMobileConversations ? "flex" : "hidden md:flex"}`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <button
                onClick={() => setShowSellerSearch(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                title="Start new conversation"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Start Messaging
              </button>
            </div>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                <div className="text-gray-400 text-4xl mb-4">💬</div>
                <p className="text-gray-600 text-center mb-2">
                  No conversations yet
                </p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Start chatting with a seller!
                </p>
                <button
                  onClick={() => setShowSellerSearch(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Start Messaging
                </button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-teal-50"
                      : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {conversation.otherParticipant?.avatar ? (
                        <Image
                          src={conversation.otherParticipant.avatar}
                          alt={conversation.otherParticipant.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                          {conversation.otherParticipant?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium truncate ${conversation.unreadCount > 0 ? "text-gray-900 font-semibold" : "text-gray-700"}`}
                      >
                        {conversation.otherParticipant?.name ||
                          conversation.otherParticipant?.email?.split("@")[0] ||
                          "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.lastMessage &&
                          formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${conversation.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}
                    >
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === user?.id && (
                            <span className="text-gray-500">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center Panel - Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-white ${!showMobileConversations ? "flex" : "hidden md:flex"}`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileConversations(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {selectedConversation.otherParticipant?.avatar ? (
                    <Image
                      src={selectedConversation.otherParticipant.avatar}
                      alt={selectedConversation.otherParticipant.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                      {selectedConversation.otherParticipant?.name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.otherParticipant?.name ||
                      selectedConversation.otherParticipant?.email?.split(
                        "@",
                      )[0] ||
                      "Unknown User"}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Online</span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {showMenuDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setShowContactInfo(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-gray-700">Contact info</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowSearchMessages(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <span className="text-gray-700">Search</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowSelectMessages(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        <span className="text-gray-700">Select messages</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowMuteNotifications(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                        </svg>
                        <span className="text-gray-700">
                          Mute notifications
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDisappearingMessages(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-gray-700">
                          Disappearing messages
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsFavorite(!isFavorite);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className={`w-5 h-5 ${isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-500"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        <span className="text-gray-700">Add to Favorites</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedConversation(null);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-700">Close chat</span>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={() => {
                          setShowReport(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                        <span className="text-gray-700">Report</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowBlock(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span className="text-gray-700">Block</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowClearChat(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="text-gray-700">Clear chat</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDeleteChat(true);
                          setShowMenuDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Delete chat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💬</div>
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender?.id === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${isOwnMessage ? "order-2" : "order-1"}`}
                        >
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                {message.sender?.avatar ? (
                                  <Image
                                    src={message.sender.avatar}
                                    alt={message.sender.name}
                                    width={24}
                                    height={24}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                                    {message.sender?.name
                                      ?.charAt(0)
                                      ?.toUpperCase() || "?"}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {message.sender?.name}
                              </span>
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? "bg-teal-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            {message.contentType === "image" &&
                              message.imageUrl && (
                                <div className="mb-2">
                                  <Image
                                    src={message.imageUrl}
                                    alt="Shared image"
                                    width={200}
                                    height={150}
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              )}

                            {message.contentType === "product" &&
                              message.product && (
                                <div className="mb-2 p-2 bg-white rounded-lg">
                                  <div className="flex gap-2">
                                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                                      {message.product.image && (
                                        <Image
                                          src={message.product.image}
                                          alt={message.product.title}
                                          width={48}
                                          height={48}
                                          className="object-cover"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {message.product.title}
                                      </p>
                                      <p className="text-sm text-teal-600 font-semibold">
                                        {message.product.price.toLocaleString()}{" "}
                                        RWF
                                      </p>
                                    </div>
                                  </div>
                                  <Link
                                    href={`/product/${message.product.slug}`}
                                    className="mt-2 block text-center text-sm text-teal-600 hover:text-teal-700 font-medium"
                                  >
                                    View Product
                                  </Link>
                                </div>
                              )}

                            {message.contentType === "order" &&
                              message.order && (
                                <div className="mb-2 p-2 bg-white rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      Order #{message.order.orderNumber}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        message.order.status === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : message.order.status === "pending"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {message.order.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Total:{" "}
                                    {message.order.total.toLocaleString()} RWF
                                  </p>
                                </div>
                              )}

                            {message.contentType === "video" &&
                              message.videoUrl && (
                                <div className="mb-2">
                                  <video
                                    src={message.videoUrl}
                                    controls
                                    className="rounded-lg max-w-full"
                                    style={{ maxHeight: "200px" }}
                                  />
                                </div>
                              )}

                            {message.contentType === "audio" &&
                              message.audioUrl && (
                                <div className="mb-2">
                                  <audio
                                    src={message.audioUrl}
                                    controls
                                    className="w-full"
                                  />
                                </div>
                              )}

                            {message.contentType === "document" &&
                              message.documentUrl && (
                                <div className="mb-2 p-2 bg-white rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {message.documentName || "Document"}
                                      </p>
                                      <a
                                        href={message.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-teal-600 hover:text-teal-700"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {message.contentType === "location" &&
                              message.location && (
                                <div className="mb-2 p-2 bg-white rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-6 h-6 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        Location
                                      </p>
                                      {message.location.address && (
                                        <p className="text-xs text-gray-500">
                                          {message.location.address}
                                        </p>
                                      )}
                                      <a
                                        href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-teal-600 hover:text-teal-700"
                                      >
                                        View on Map
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {message.contentType === "contact" &&
                              message.contact && (
                                <div className="mb-2 p-2 bg-white rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-gray-500 font-medium">
                                        {message.contact?.name
                                          ?.charAt(0)
                                          ?.toUpperCase() || "?"}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {message.contact.name}
                                      </p>
                                      {message.contact.phone && (
                                        <p className="text-xs text-gray-500">
                                          {message.contact.phone}
                                        </p>
                                      )}
                                      {message.contact.email && (
                                        <p className="text-xs text-gray-500">
                                          {message.contact.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {message.replyTo && (
                              <div className="mb-2 p-2 bg-white/50 rounded-lg border-l-4 border-teal-500">
                                <p className="text-xs text-gray-500 mb-1">
                                  {message.replyTo.senderName}
                                </p>
                                <p className="text-xs text-gray-700 truncate">
                                  {message.replyTo.content}
                                </p>
                              </div>
                            )}

                            {message.content && (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>

                          <div
                            className={`flex items-center gap-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <span className="text-xs text-gray-400">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {message.editedAt && (
                              <span className="text-xs text-gray-400">
                                (edited)
                              </span>
                            )}
                            {isOwnMessage && (
                              <span className="ml-1">
                                {getMessageStatusIcon(message.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {Array.from(typingUsers).join(", ")}{" "}
                  {typingUsers.size === 1 ? "is" : "are"} typing...
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200"
              >
                <div className="flex items-center gap-2">
                  {/* Media Menu Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMediaMenu(!showMediaMenu)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      disabled={uploading}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>

                    {/* Media Menu Dropdown */}
                    {showMediaMenu && (
                      <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Video
                          </button>
                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                              />
                            </svg>
                            Audio
                          </button>
                          <button
                            type="button"
                            onClick={() => documentInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            Document
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareLocation()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Location
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareContact()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <svg
                              className="w-5 h-5 text-indigo-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Contact
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "image");
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "video");
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={audioInputRef}
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "audio");
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={documentInputRef}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "document");
                    }}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={sending || uploading}
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || uploading}
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Context Sidebar (Desktop only) */}
        {selectedConversation && (
          <div className="hidden lg:block w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">
              Conversation Info
            </h3>

            {/* Participant Info */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  {selectedConversation.otherParticipant?.avatar ? (
                    <Image
                      src={selectedConversation.otherParticipant.avatar}
                      alt={selectedConversation.otherParticipant.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                      {selectedConversation.otherParticipant?.name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.otherParticipant?.name ||
                      selectedConversation.otherParticipant?.email?.split(
                        "@",
                      )[0] ||
                      "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.otherParticipant?.email}
                  </p>
                </div>
              </div>

              <Link
                href={`/store/${selectedConversation.otherParticipant?.email.split("@")[0]}`}
                className="block w-full text-center py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                View Store
              </Link>
            </div>

            {/* Order Context */}
            {selectedConversation.orderId && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Related Order
                </h4>
                <p className="text-sm text-gray-600">
                  Order #{selectedConversation.orderId.slice(-8)}
                </p>
                <Link
                  href={`/orders/${selectedConversation.orderId}`}
                  className="mt-2 block text-sm text-teal-600 hover:text-teal-700"
                >
                  View Order Details
                </Link>
              </div>
            )}

            {/* Product Context */}
            {selectedConversation.productId && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Related Product
                </h4>
                <Link
                  href={`/product/${selectedConversation.productId}`}
                  className="block text-sm text-teal-600 hover:text-teal-700"
                >
                  View Product
                </Link>
              </div>
            )}

            {/* Shared Media */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Shared Media</h4>
              <div className="grid grid-cols-3 gap-2">
                {messages
                  .filter((m) => m.contentType === "image" && m.imageUrl)
                  .slice(0, 6)
                  .map((message) => (
                    <div
                      key={message.id}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={message.imageUrl!}
                        alt="Shared media"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Seller Search Modal */}
      {showSellerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Start New Conversation
                </h2>
                <button
                  onClick={() => {
                    setShowSellerSearch(false);
                    setSellerSearchQuery("");
                    setSellerSearchCategory("");
                    setSellerSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Search Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search by name, username, or email (sellers, buyers, users)
                  </label>
                  <input
                    type="text"
                    value={sellerSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellerSearchQuery(value);

                      // Clear existing timeout
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }

                      // Set new timeout for automatic search
                      searchTimeoutRef.current = setTimeout(() => {
                        if (value || sellerSearchCategory) {
                          handleSearchSellers(1);
                        } else {
                          setSellerSearchResults([]);
                        }
                      }, 300);
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchSellers(1)
                    }
                    placeholder="Enter name, username, or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or search by product category
                  </label>
                  <input
                    type="text"
                    value={sellerSearchCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellerSearchCategory(value);

                      // Clear existing timeout
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }

                      // Set new timeout for automatic search
                      searchTimeoutRef.current = setTimeout(() => {
                        if (sellerSearchQuery || value) {
                          handleSearchSellers(1);
                        } else {
                          setSellerSearchResults([]);
                        }
                      }, 300);
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchSellers(1)
                    }
                    placeholder="e.g., Electronics, Clothing, Home & Garden..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  onClick={() => handleSearchSellers(1)}
                  disabled={
                    (!sellerSearchQuery && !sellerSearchCategory) ||
                    sellerSearchLoading
                  }
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sellerSearchLoading ? "Searching..." : "Search Users"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {sellerSearchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p>Search for users to start messaging</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerSearchResults.map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {seller.avatar ? (
                          <img
                            src={seller.avatar}
                            alt={seller.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {(
                              seller.storeName ||
                              seller.name ||
                              seller.username ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {seller.storeName ||
                              seller.name ||
                              (seller.username
                                ? `@${seller.username}`
                                : "Unknown User")}
                          </h3>
                          {seller.isVerified && (
                            <svg
                              className="w-4 h-4 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>

                        {seller.username && seller.storeName && (
                          <p className="text-sm text-gray-500 truncate">
                            @{seller.username}
                          </p>
                        )}

                        {seller.storeName &&
                          seller.name &&
                          seller.name !== seller.storeName && (
                            <p className="text-sm text-gray-600 truncate">
                              {seller.name}
                            </p>
                          )}

                        <div className="flex items-center gap-2 mt-1">
                          {seller.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {seller.rating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {seller.totalSales > 0 && (
                            <span className="text-sm text-gray-500">
                              {seller.totalSales} sales
                            </span>
                          )}
                        </div>

                        {seller.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {seller.categories
                              .slice(0, 3)
                              .map((cat: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  {cat}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartConversation(seller)}
                        disabled={startingConversation}
                        className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {startingConversation ? "Starting..." : "Message"}
                      </button>
                    </div>
                  ))}

                  {/* Load More */}
                  {sellerSearchPage < sellerSearchTotalPages && (
                    <button
                      onClick={() => handleSearchSellers(sellerSearchPage + 1)}
                      disabled={sellerSearchLoading}
                      className="w-full py-2 text-teal-600 hover:text-teal-700 text-sm font-medium disabled:opacity-50"
                    >
                      {sellerSearchLoading ? "Loading..." : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {showContactInfo && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Info
              </h2>
              <button
                onClick={() => setShowContactInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {selectedConversation.otherParticipant?.avatar ? (
                    <Image
                      src={selectedConversation.otherParticipant.avatar}
                      alt={selectedConversation.otherParticipant.name}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-medium">
                      {selectedConversation.otherParticipant?.name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedConversation.otherParticipant?.name ||
                    "Unknown User"}
                </h3>
                <p className="text-gray-500">
                  {selectedConversation.otherParticipant?.email}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-700">
                    {selectedConversation.otherParticipant?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Messages Modal */}
      {showSearchMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Messages
              </h2>
              <button
                onClick={() => {
                  setShowSearchMessages(false);
                  setSearchMessagesQuery("");
                  setSearchMessagesResults([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchMessagesQuery}
                onChange={(e) => setSearchMessagesQuery(e.target.value)}
                placeholder="Search in conversation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {searchMessagesResults.length > 0 ? (
                <div className="space-y-2">
                  {searchMessagesResults.map((msg) => (
                    <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No messages found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Messages Modal */}
      {showSelectMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Select Messages
              </h2>
              <button
                onClick={() => {
                  setShowSelectMessages(false);
                  setSelectedMessageIds(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      const newSet = new Set(selectedMessageIds);
                      if (newSet.has(msg.id)) {
                        newSet.delete(msg.id);
                      } else {
                        newSet.add(msg.id);
                      }
                      setSelectedMessageIds(newSet);
                    }}
                    className={`p-3 rounded-lg cursor-pointer ${selectedMessageIds.has(msg.id) ? "bg-teal-50 border-2 border-teal-500" : "bg-gray-50"}`}
                  >
                    <p className="text-sm text-gray-900">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSelectMessages(false);
                  setSelectedMessageIds(new Set());
                }}
                className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Done ({selectedMessageIds.size} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mute Notifications Modal */}
      {showMuteNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Mute Notifications
              </h2>
              <button
                onClick={() => setShowMuteNotifications(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Mute notifications for this conversation?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteNotifications(false);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="font-medium text-gray-900">Mute</span>
                  <p className="text-sm text-gray-500">
                    You won't receive notifications
                  </p>
                </button>
                <button
                  onClick={() => {
                    setIsMuted(false);
                    setShowMuteNotifications(false);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="font-medium text-gray-900">Unmute</span>
                  <p className="text-sm text-gray-500">
                    You will receive notifications
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disappearing Messages Modal */}
      {showDisappearingMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Disappearing Messages
              </h2>
              <button
                onClick={() => setShowDisappearingMessages(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Messages will disappear after they are seen.
              </p>
              <div className="space-y-3">
                {["off", "24 hours", "7 days", "90 days"].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => {
                      setDisappearingMessagesDuration(duration);
                      setDisappearingMessagesEnabled(duration !== "off");
                      setShowDisappearingMessages(false);
                    }}
                    className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg border ${disappearingMessagesDuration === duration ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}
                  >
                    <span className="font-medium text-gray-900 capitalize">
                      {duration}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Report</h2>
              <button
                onClick={() => {
                  setShowReport(false);
                  setReportReason("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Why are you reporting this conversation?
              </p>
              <div className="space-y-3">
                {[
                  "Spam",
                  "Harassment",
                  "Inappropriate content",
                  "Scam",
                  "Other",
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg border ${reportReason === reason ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}
                  >
                    <span className="font-medium text-gray-900">{reason}</span>
                  </button>
                ))}
              </div>
              {reportReason && (
                <div className="mt-4">
                  <textarea
                    placeholder="Provide more details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={3}
                  />
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowReport(false);
                    setReportReason("");
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Report submitted");
                    setShowReport(false);
                    setReportReason("");
                  }}
                  disabled={!reportReason}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Block User
              </h2>
              <button
                onClick={() => setShowBlock(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to block{" "}
                {selectedConversation?.otherParticipant?.name || "this user"}?
                They won't be able to send you messages.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlock(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("User blocked");
                    setShowBlock(false);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Modal */}
      {showClearChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Clear Chat
              </h2>
              <button
                onClick={() => setShowClearChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to clear all messages in this chat? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearChat(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setMessages([]);
                    setShowClearChat(false);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Modal */}
      {showDeleteChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Chat
              </h2>
              <button
                onClick={() => setShowDeleteChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this chat? This will delete all
                messages and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteChat(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConversations((prev) =>
                      prev.filter((c) => c.id !== selectedConversation?.id),
                    );
                    setSelectedConversation(null);
                    setShowDeleteChat(false);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
