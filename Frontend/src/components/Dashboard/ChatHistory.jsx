// Shanmuka
import {
  Box,
  Flex,
  Heading,
  Input,
  Icon,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Badge,
  Accordion,
  Span,
  Link,
  Pagination,
  ButtonGroup,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  AiOutlineSearch,
  AiOutlineDown,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineMessage,
} from "react-icons/ai";
import { FaDownload } from "react-icons/fa6";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { IoMdDownload } from "react-icons/io";
import { RiRobot3Line } from "react-icons/ri";
import { useAlert } from "../AlertProvider";

export default function ChatHistory() {
  const [sessions, setSessions] = useState([]); // Initialize as an empty array
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Initialize page state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSessions, setFilteredSessions] = useState(sessions);
  const { addAlert, removeAlert } = useAlert(); // Assuming you have a custom hook for alerts
  const isDateToday = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const parseMessageText = (text) => {
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;

    let match;
    while ((match = markdownLinkRegex.exec(text)) !== null) {
      const [fullMatch, linkText, url] = match;

      // Push text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>
        );
      }

      // Push the link
      parts.push(
        <Link
          key={match.index}
          href={url}
          color="teal.500"
          isExternal
          _hover={{ textDecoration: "underline" }}
        >
          {linkText}
        </Link>
      );

      lastIndex = match.index + fullMatch.length;
    }

    // Push remaining text after last match
    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  useEffect(() => {
    setFilteredSessions(searchSessions(sessions, searchQuery));
  }, [searchQuery, sessions]);

  useEffect(() => {
    const Alerid = addAlert("info", "Loading chat history...", null, true); // Show loading alert
    fetch("http://127.0.0.1:8000/api/get-user-chat-history/", {
      method: "GET",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load sessions");
        }
        return res.json();
      })
      .then((data) => {
        // Assuming the data object contains a 'sessions' property that is an array
        if (data && Array.isArray(data.sessions)) {
          setSessions(data.sessions); // Set sessions from the data.sessions array
        } else {
          setError("Invalid data format received");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        removeAlert(Alerid); // Remove loading alert
        setTimeout(() => {
          addAlert("success", "Chat history loaded successfully", 2000); // Show success alert
        }, 1000); // Delay to show loading alert before success
      });
  }, []);

  const handleDownload = (sessionId) => {
    fetch(`http://127.0.0.1:8000/api/get-chat-pdf/${sessionId}/`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text || "Failed to load PDF");
          });
        }
        return res.blob(); // Get the PDF as a blob
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank"); // Open in new tab
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      })
      .catch((err) => {
        setError(err.message);
      });
  };
  

  if (error) return <p>Error: {error}</p>;

  const pageSize = 5;
  const count = sessions.length;
  const startRange = (page - 1) * pageSize;
  const endRange = startRange + pageSize;
  const visibleSessions = filteredSessions.slice(startRange, endRange);

  const searchSessions = (sessions, query) => {
    if (!query) return sessions;

    return sessions.filter((session) =>
      session.summary.toLowerCase().includes(query.toLowerCase())
    );
  };
  return (
    <Box px={{ base: 4, lg: 6 }} py={26} mx="auto" h={"95vh"} w="100%">
      {/* Header */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "center" }}
        mb={6}
        p={3}
        position="sticky"
        top={0}
        zIndex={10}
        bg="whiteAlpha.900"
        backdropFilter="blur(6px)"
        rounded="lg"
        boxShadow="sm"
      >
        <Heading size="lg" mb={{ base: 3, md: 0 }} color="#2C3E50">
          Chat History
        </Heading>

        <Flex w={{ base: "full", md: "auto" }} position="relative">
          <Input
            placeholder="Search conversations..."
            pl="2.5rem"
            w={{ base: "full", md: "16rem" }}
            borderColor="#C9E4CA"
            focusbordercolor="#A7C5A6"
            size="sm"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Icon
            as={AiOutlineSearch}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
          />
        </Flex>
      </Flex>

      {/* Threads */}
      {visibleSessions.length > 0 ? (
        <Accordion.Root defaultValue={[new Date()]} multiple>
          {visibleSessions.map((session) => (
            <Accordion.Item key={session.session_id} value={session.start_time}>
              <Accordion.ItemTrigger>
                <Span flex="1">
                  {/* <Text fontWeight="medium" color="#2C3E50">
                  {session.summary}
                </Text> */}
                  <HStack gap={3}>
                    <Text fontWeight="medium" color="#2C3E50">
                      {session.summary}
                    </Text>
                    <Text fontSize="xs" color="#2C3E50" opacity={0.75}>
                      {new Date(session.start_time).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                    {isDateToday(session.start_time) && (
                      <Badge
                        variant="solid"
                        colorScheme="red"
                        borderRadius="full"
                        px={2}
                      >
                        New
                      </Badge>
                    )}
                  </HStack>
                </Span>
                <IconButton
                  variant={"ghost"}
                  aria-label="Download"
                  onClick={() => handleDownload(session.session_id)}
                  as={Link}
                >
                  <IoMdDownload />
                </IconButton>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                <Accordion.ItemBody p={4} bg="gray.50">
                  {session.messages ? (
                    <VStack align="stretch" gap={4}>
                      {session.messages.map((msg, idx) => (
                        <HStack
                          align="start"
                          key={idx}
                          justifyContent={
                            msg.sent_by_user ? "flex-end" : "flex-start"
                          }
                        >
                          {!msg.sent_by_user ? (
                            <Avatar.Root>
                              <Avatar.Fallback />
                              <Avatar.Image
                                size="sm"
                                name="MC"
                                bg="#C9E4CA"
                                color="black"
                                fontSize="xs"
                                src="https://img.freepik.com/free-vector/cartoon-style-robot-vectorart_78370-4103.jpg"
                              />
                            </Avatar.Root>
                          ) : (
                            <Avatar.Root>
                              <Avatar.Fallback name="Segun Adebayo" />
                              <Avatar.Image
                                bg="#FFD8D8"
                                color="#2C3E50"
                                name="JS"
                                size="sm"
                                src="https://avatar.iran.liara.run/public"
                              />
                            </Avatar.Root>
                          )}
                          <Box
                            bg={!msg.sent_by_user ? "#E6F4F1" : "gray.100"}
                            p={3}
                            rounded="lg"
                            maxW="80%"
                            color="#2C3E50"
                          >
                            <Text fontSize="sm">
                              {parseMessageText(msg.content)}
                            </Text>
                            {msg.list && (
                              <Box
                                as="ul"
                                pl={4}
                                pt={2}
                                color="#2C3E50"
                                fontSize="sm"
                                listStyleType="disc"
                              >
                                {msg.list.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </Box>
                            )}
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {new Date(msg.timestamp).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      fontStyle="italic"
                      textAlign="center"
                    >
                      Click to expand conversation
                    </Text>
                  )}
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ) : (
        <Text
          fontSize="md"
          color="gray.500"
          textAlign="center"
          mt={10}
          fontStyle="italic"
        >
          No chat history found.
        </Text>
      )}

      {/* Pagination */}
      <Flex justify="center" mt={8} gap={2}>
        <Pagination.Root
          count={count}
          pageSize={pageSize}
          page={page}
          onPageChange={(e) => setPage(e.page)}
        >
          <ButtonGroup variant="ghost" size="sm">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <HiChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(page) => (
                <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                  {page.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton>
                <HiChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      </Flex>
    </Box>
  );
}
