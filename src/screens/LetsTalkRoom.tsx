import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { fetchMembers } from "../services/LetsTalkService";
import { Member } from "../../src/constants/LetsTalkTypes";

const { width: SCREEN_W } = Dimensions.get("window");
const MAX_VIP = 130;
const MAX_MEMBERS = 500000;

/* ─────────────────────────────────────────────
   PODIUM SVG (pure React Native drawing)
───────────────────────────────────────────── */
function PodiumSimulation({
  currentSpeaker,
  micHeightAnim,
  liveCamera,
}: {
  currentSpeaker: Member | null;
  micHeightAnim: Animated.Value;
  liveCamera: boolean;
}) {
  return (
    <View style={styles.podiumWrapper}>
      {/* Lectern body */}
      <View style={styles.lectern}>
        <View style={styles.lecternTop} />
        <View style={styles.lecternBody}>
          <View style={styles.lecternPanel} />
        </View>
        <View style={styles.lecternBase} />

        {/* Mic stand + mic */}
        <Animated.View
          style={[
            styles.micStandContainer,
            {
              bottom: micHeightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 90],
              }),
            },
          ]}
        >
          <View style={styles.micHead}>
            <View style={styles.micMesh} />
          </View>
          <View style={styles.micNeck} />
          <View style={styles.micBase} />
        </Animated.View>

        {/* Speaker avatar on lectern */}
        <View style={styles.speakerOnPodium}>
          {currentSpeaker ? (
            liveCamera ? (
              <View style={styles.liveCamPlaceholder}>
                <Text style={styles.liveCamText}>LIVE</Text>
              </View>
            ) : (
              <Image
                source={{ uri: currentSpeaker.avatar }}
                style={styles.speakerAvatar}
              />
            )
          ) : (
            <View style={styles.emptyPodiumCircle}>
              <Text style={styles.emptyPodiumText}>Podium</Text>
            </View>
          )}
        </View>
      </View>

      {currentSpeaker && (
        <Text style={styles.speakerNameOnPodium} numberOfLines={1}>
          {currentSpeaker.name}
        </Text>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   VIP TAG BADGE
───────────────────────────────────────────── */
function VipBadge() {
  return (
    <View style={styles.vipBadge}>
      <Text style={styles.vipBadgeText}>VIP</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────
   MEMBER CARD (reusable)
───────────────────────────────────────────── */
function MemberCard({
  item,
  isHost,
  onPress,
  onLongPress,
  showRemove,
}: {
  item: Member;
  isHost: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showRemove?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.memberCard,
        item.isVIP && styles.memberCardVIP,
        item.isSpeaking && styles.memberCardSpeaking,
      ]}
      activeOpacity={0.8}
    >
      <View style={{ position: "relative" }}>
        <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
        {item.isVIP && <VipBadge />}
        {item.hasMic && (
          <View style={styles.micIndicator}>
            <Text style={{ fontSize: 8 }}>🎙</Text>
          </View>
        )}
      </View>
      <Text style={styles.memberName} numberOfLines={1}>
        {item.name}
      </Text>
      {showRemove && isHost && item.isVIP && (
        <View style={styles.removeTag}>
          <Text style={styles.removeTagText}>Remove</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function LetsTalkRoom() {
  const hostId = "host123";
  const currentUserId = "host123"; // change to "user999" for non-host view
  const isHost = currentUserId === hostId;

  /* ── STATE ── */
  const [roomTitle, setRoomTitle] = useState<string>("ROOM TITLE – TAP TO EDIT");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const [podiumVisible, setPodiumVisible] = useState(true);
  const [liveCamera, setLiveCamera] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [vipList, setVipList] = useState<Member[]>([]);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);

  const [currentSpeaker, setCurrentSpeaker] = useState<Member | null>(null);
  const [nextSpeaker, setNextSpeaker] = useState<Member | null>(null);
  const [hostFinalRemarks, setHostFinalRemarks] = useState(false);

  const [talkQueue, setTalkQueue] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [vipSearchQuery, setVipSearchQuery] = useState("");
  const [nextSpeakerSearch, setNextSpeakerSearch] = useState("");

  const [showNextSpeakerModal, setShowNextSpeakerModal] = useState(false);

  const [likes, setLikes] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<{ id: string; text: string; author: string }[]>([]);

  const [countdown, setCountdown] = useState<number>(0);
  const [scheduledTime] = useState<number>(Date.now() + 7200000);

  const [aiMessage, setAiMessage] = useState<string>(
    "Welcome to Let's Talk! The session will begin shortly."
  );

  const micHeightAnim = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  /* ── COUNTDOWN ── */
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = scheduledTime - Date.now();
      setCountdown(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledTime]);

  /* ── LOAD MEMBERS ── */
  const loadMembers = useCallback(async () => {
    if (loadingMore) return;
    if (members.length >= MAX_MEMBERS) return;
    setLoadingMore(true);
    try {
      const snapshot = await fetchMembers("room123", lastDoc);
      const newMembers = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];
      setMembers((prev) => [...prev, ...newMembers]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error("Error loading members:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, members.length]);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── MIC ANIMATION when speaker changes ── */
  useEffect(() => {
    if (!currentSpeaker) return;
    // Simulate AI adjusting mic height based on name length (proxy for height)
    const targetHeight = 0.3 + ((currentSpeaker.name.length % 5) / 10);
    Animated.spring(micHeightAnim, {
      toValue: targetHeight,
      useNativeDriver: false,
      friction: 4,
    }).start();
  }, [currentSpeaker, micHeightAnim]);

  /* ── HELPERS ── */
  const allMembers = useMemo(() => {
    const vipIds = new Set(vipList.map((v) => v.id));
    return [
      ...vipList,
      ...members.filter((m) => !vipIds.has(m.id)),
    ];
  }, [vipList, members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return q ? allMembers.filter((m) => m.name.toLowerCase().includes(q)) : allMembers;
  }, [allMembers, searchQuery]);

  const filteredForVipSearch = useMemo(() => {
    const q = vipSearchQuery.toLowerCase();
    const vipIds = new Set(vipList.map((v) => v.id));
    const pool = q
      ? members.filter((m) => m.name.toLowerCase().includes(q) && !vipIds.has(m.id))
      : members.filter((m) => !vipIds.has(m.id));
    return pool;
  }, [members, vipSearchQuery, vipList]);

  const filteredForNextSpeaker = useMemo(() => {
    const q = nextSpeakerSearch.toLowerCase();
    return q ? allMembers.filter((m) => m.name.toLowerCase().includes(q)) : allMembers;
  }, [allMembers, nextSpeakerSearch]);

  /* ── VIP MANAGEMENT ── */
  const addVip = (member: Member) => {
    if (vipList.length >= MAX_VIP) {
      Alert.alert("VIP Limit", `Maximum ${MAX_VIP} VIP members allowed.`);
      return;
    }
    if (vipList.some((v) => v.id === member.id)) return;
    setVipList((prev) => [...prev, { ...member, isVIP: true }]);
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, isVIP: true } : m))
    );
    setAiMessage(`${member.name} has been added to the VIP list.`);
  };

  const removeVip = (memberId: string) => {
    const member = vipList.find((v) => v.id === memberId);
    setVipList((prev) => prev.filter((v) => v.id !== memberId));
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, isVIP: false } : m))
    );
    setLongPressedId(null);
    if (member) setAiMessage(`${member.name} has been removed from VIP.`);
  };

  /* ── SPEAK SYSTEM ── */
  const requestToSpeak = () => {
    if (!talkQueue.includes(currentUserId)) {
      setTalkQueue((prev) => [...prev, currentUserId]);
      setAiMessage("Your request to speak has been noted. Please wait for the host.");
    }
  };

  const selectNextSpeaker = (member: Member | null, isHostFinal = false) => {
    setNextSpeaker(member);
    setHostFinalRemarks(isHostFinal);
    setShowNextSpeakerModal(false);
    setNextSpeakerSearch("");
    if (isHostFinal) {
      setAiMessage(
        "The host will now make final remarks and end the meeting. Thank you all for participating!"
      );
    } else if (member) {
      setAiMessage(
        `Next speaker selected: ${member.name}. Please be ready to take the podium.`
      );
    }
  };

  const finishedSpeaking = () => {
    if (hostFinalRemarks) {
      Alert.alert(
        "End Meeting",
        "Are you sure you want to end the Let's Talk Room meeting?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Meeting",
            style: "destructive",
            onPress: () => {
              setCurrentSpeaker(null);
              setNextSpeaker(null);
              setAiMessage("The meeting has ended. Thank you all for joining!");
            },
          },
        ]
      );
      return;
    }

    if (nextSpeaker) {
      const incoming = nextSpeaker;
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          hasMic: m.id === incoming.id,
          isSpeaking: m.id === incoming.id,
        }))
      );
      setCurrentSpeaker(incoming);
      setNextSpeaker(null);
      setHostFinalRemarks(false);
      setAiMessage(`The mic has passed to ${incoming.name}. Please begin when ready.`);
    } else {
      setCurrentSpeaker(null);
      setMembers((prev) =>
        prev.map((m) => ({ ...m, hasMic: false, isSpeaking: false }))
      );
      setAiMessage("The speaker has finished. The host may now select the next speaker.");
    }
  };

  /* ── LIKES / COMMENTS / SHARE ── */
  const handleLike = () => {
    setLikedByMe((prev) => !prev);
    setLikes((prev) => (likedByMe ? prev - 1 : prev + 1));
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), text: commentText.trim(), author: "You" },
    ]);
    setCommentText("");
  };

  const handleShare = () => {
    Alert.alert("Share", "Share this Let's Talk Room with your friends!");
  };

  /* ── TITLE EDIT ── */
  const startTitleEdit = () => {
    if (!isHost) return;
    setTitleDraft(roomTitle === "ROOM TITLE – TAP TO EDIT" ? "" : roomTitle);
    setEditingTitle(true);
  };

  const saveTitleEdit = () => {
    const trimmed = titleDraft.trim().toUpperCase();
    setRoomTitle(trimmed || "ROOM TITLE – TAP TO EDIT");
    setEditingTitle(false);
  };

  /* ── COUNTDOWN DISPLAY ── */
  const countdownMins = Math.floor(countdown / 60000);
  const countdownSecs = Math.floor((countdown / 1000) % 60);

    /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* ════════ 1. ROOM TITLE ════════ */}
      <TouchableOpacity onPress={startTitleEdit} activeOpacity={isHost ? 0.7 : 1}>
        {editingTitle ? (
          <View style={styles.titleEditRow}>
            <TextInput
              style={styles.titleInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              autoFocus
              placeholder="Type room title..."
              placeholderTextColor="#aaa"
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={saveTitleEdit}
            />
            <TouchableOpacity onPress={saveTitleEdit} style={styles.titleSaveBtn}>
              <Text style={styles.titleSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.roomTitle}>{roomTitle}</Text>
        )}
      </TouchableOpacity>
      {isHost && !editingTitle && (
        <Text style={styles.tapToEditHint}>Tap title to edit</Text>
      )}

      {/* ════════ COUNTDOWN ════════ */}
      <Text style={styles.countdown}>
        ⏱ {countdownMins}m {countdownSecs}s remaining
      </Text>

      {/* ════════ 2 & 5. PODIUM TOGGLE + SIMULATION ════════ */}
      <View style={styles.podiumToggleRow}>
        <Text style={styles.sectionLabel}>Podium Simulation</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, podiumVisible ? styles.toggleOn : styles.toggleOff]}
          onPress={() => setPodiumVisible((p) => !p)}
        >
          <Text style={styles.toggleBtnText}>{podiumVisible ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>

      {/* ════════ PODIUM + NEXT SPEAKER AREA ════════ */}
      <View style={styles.podiumAndNextRow}>
        {/* PODIUM */}
        {podiumVisible && (
          <PodiumSimulation
            currentSpeaker={currentSpeaker}
            micHeightAnim={micHeightAnim}
            liveCamera={liveCamera}
          />
        )}

        {/* NEXT SPEAKER PANEL */}
        <View style={styles.nextSpeakerPanel}>
          <Text style={styles.nextSpeakerLabel}>Next Speaker:</Text>
          {nextSpeaker ? (
            <View style={styles.nextSpeakerCard}>
              <Image
                source={{ uri: nextSpeaker.avatar }}
                style={styles.nextSpeakerAvatar}
              />
              <Text style={styles.nextSpeakerName} numberOfLines={2}>
                {nextSpeaker.name}
              </Text>
            </View>
          ) : hostFinalRemarks ? (
            <View style={styles.nextSpeakerCard}>
              <View style={styles.hostRemarksIcon}>
                <Text style={{ fontSize: 24 }}>🎤</Text>
              </View>
              <Text style={styles.nextSpeakerName}>Host Final{"\n"}Remarks</Text>
            </View>
          ) : (
            <View style={styles.nextSpeakerEmpty}>
              <Text style={styles.nextSpeakerEmptyText}>
                {isHost ? "Select next speaker below" : "Awaiting host selection"}
              </Text>
            </View>
          )}

          {isHost && (
            <TouchableOpacity
              style={styles.selectNextBtn}
              onPress={() => setShowNextSpeakerModal(true)}
            >
              <Text style={styles.selectNextBtnText}>Select Next Speaker</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ════════ 6. CAMERA TOGGLE ════════ */}
      {currentSpeaker && currentSpeaker.id === currentUserId && (
        <TouchableOpacity
          style={[styles.cameraToggleBtn, liveCamera && styles.cameraToggleActive]}
          onPress={() => setLiveCamera((p) => !p)}
        >
          <Text style={styles.cameraToggleText}>
            {liveCamera ? "📷 Live Camera: ON" : "📷 Turn On Live Camera"}
          </Text>
        </TouchableOpacity>
      )}

      {/* ════════ "I Have Finished" BUTTON ════════ */}
      {currentSpeaker && currentSpeaker.id === currentUserId && (
        <TouchableOpacity style={styles.finishedBtn} onPress={finishedSpeaking}>
          <Text style={styles.finishedBtnText}>I Have Finished</Text>
        </TouchableOpacity>
      )}

      {/* ════════ AI ANNOUNCER ════════ */}
      <View style={styles.aiBox}>
        <Text style={styles.aiBoxTitle}>🤖 AI Program Assistant</Text>
        <Text style={styles.aiBoxMsg}>{aiMessage}</Text>
      </View>

      {/* ════════ 7. VIP SECTION ════════ */}
      <View style={styles.vipSection}>
        <Text style={styles.sectionLabel}>
          VIP Members ({vipList.length}/{MAX_VIP})
        </Text>

        {isHost && (
          <TextInput
            style={styles.searchInput}
            value={vipSearchQuery}
            onChangeText={setVipSearchQuery}
            placeholder="Search members to add as VIP..."
            placeholderTextColor="#999"
          />
        )}

        {/* VIP search results (for host to tap and add) */}
        {isHost && vipSearchQuery.length > 0 && (
          <View style={styles.searchDropdown}>
            {filteredForVipSearch.slice(0, 5).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.searchDropdownItem}
                onPress={() => {
                  addVip(m);
                  setVipSearchQuery("");
                }}
              >
                <Image source={{ uri: m.avatar }} style={styles.dropdownAvatar} />
                <Text>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* VIP horizontal list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vipScroll}>
          {vipList.map((item) => (
            <MemberCard
              key={item.id}
              item={item}
              isHost={isHost}
              showRemove={longPressedId === item.id}
              onPress={() => {
                if (longPressedId === item.id && isHost) removeVip(item.id);
                else setLongPressedId(null);
              }}
              onLongPress={() => {
                if (isHost) setLongPressedId(item.id);
              }}
            />
          ))}
          {vipList.length === 0 && (
            <Text style={styles.emptyVipText}>No VIP members yet.</Text>
          )}
        </ScrollView>
      </View>

      {/* ════════ HOST: TALK QUEUE ════════ */}
      {isHost && talkQueue.length > 0 && (
        <View style={styles.queueSection}>
          <Text style={styles.sectionLabel}>Speaking Requests</Text>
          {talkQueue.map((id) => {
            const user = allMembers.find((m) => m.id === id);
            return (
              <TouchableOpacity
                key={id}
                style={styles.queueItem}
                onPress={() => {
                  if (user) {
                    setMembers((prev) =>
                      prev.map((m) => ({
                        ...m,
                        hasMic: m.id === user.id,
                        isSpeaking: m.id === user.id,
                      }))
                    );
                    setCurrentSpeaker(user);
                    setTalkQueue((prev) => prev.filter((i) => i !== id));
                    setAiMessage(`${user.name} has been granted the mic. Please begin.`);
                  }
                }}
              >
                <Text style={styles.queueItemText}>Grant mic to {user?.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ════════ RAISE HAND (non-host) ════════ */}
      {!isHost && (
        <TouchableOpacity onPress={requestToSpeak} style={styles.raiseHandBtn}>
          <Text style={styles.raiseHandText}>✋ Raise Hand to Speak</Text>
        </TouchableOpacity>
      )}

      {/* ════════ 8. ALL MEMBERS LIST ════════ */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionLabel}>
          All Members ({allMembers.length.toLocaleString()})
        </Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search members..."
          placeholderTextColor="#999"
        />
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          horizontal
          onEndReached={loadMembers}
          onEndReachedThreshold={0.5}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <MemberCard
              key={item.id}
              item={item}
              isHost={isHost}
              onPress={() => {
                if (isHost && !item.isVIP) addVip(item);
              }}
              onLongPress={() => {
                if (isHost && item.isVIP) setLongPressedId(item.id);
              }}
              showRemove={longPressedId === item.id}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={{ color: "#888" }}>Loading...</Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* ════════ 10. REACTIONS: LIKE / COMMENT / SHARE ════════ */}
      <View style={styles.reactionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.reactionBtn} activeOpacity={0.8}>
          <Animated.Text
            style={[styles.reactionIcon, { transform: [{ scale: likeScale }] }]}
          >
            {likedByMe ? "❤️" : "🤍"}
          </Animated.Text>
          <Text style={styles.reactionCount}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowCommentModal(true)}
          style={styles.reactionBtn}
        >
          <Text style={styles.reactionIcon}>💬</Text>
          <Text style={styles.reactionCount}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.reactionBtn}>
          <Text style={styles.reactionIcon}>↗️</Text>
          <Text style={styles.reactionCount}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ════════ NEXT SPEAKER MODAL ════════ */}
      <Modal
        visible={showNextSpeakerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNextSpeakerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Who is the Next Speaker?</Text>

            <TextInput
              style={styles.searchInput}
              value={nextSpeakerSearch}
              onChangeText={setNextSpeakerSearch}
              placeholder="Search by name..."
              placeholderTextColor="#999"
              autoFocus
            />

            <ScrollView style={{ maxHeight: 280 }}>
              {/* Host final remarks option */}
              <TouchableOpacity
                style={styles.hostRemarksOption}
                onPress={() => selectNextSpeaker(null, true)}
              >
                <Text style={styles.hostRemarksOptionText}>
                  🎤 The Next Speaker is the Host to make final remarks and end the meeting
                </Text>
              </TouchableOpacity>

              {filteredForNextSpeaker.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.nextSpeakerListItem}
                  onPress={() => selectNextSpeaker(m)}
                >
                  <Image source={{ uri: m.avatar }} style={styles.dropdownAvatar} />
                  <Text style={{ flex: 1 }}>{m.name}</Text>
                  {m.isVIP && <Text style={styles.vipTagInline}>VIP</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowNextSpeakerModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════ COMMENT MODAL ════════ */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Comments ({comments.length})</Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {comments.length === 0 && (
                <Text style={{ color: "#999", textAlign: "center", padding: 20 }}>
                  No comments yet. Be the first!
                </Text>
              )}
              {comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{c.author}</Text>
                  <Text>{c.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor="#999"
                returnKeyType="send"
                onSubmitEditing={submitComment}
              />
              <TouchableOpacity onPress={submitComment} style={styles.sendBtn}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowCommentModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const PODIUM_BROWN = "#8B5E3C";
const PODIUM_DARK = "#5C3D1E";
const MIC_SILVER = "#B0B0B0";
const VIP_RED = "#E53935";
const AI_BG = "#F0F4FF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 14,
  },

  /* Title */
  roomTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    color: "#111",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  tapToEditHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#aaa",
    marginBottom: 4,
  },
  titleEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  titleInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    backgroundColor: "#fff",
  },
  titleSaveBtn: {
    marginLeft: 8,
    backgroundColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  titleSaveBtnText: { color: "#fff", fontWeight: "700" },

  /* Countdown */
  countdown: {
    textAlign: "center",
    fontSize: 13,
    color: "#C62828",
    fontWeight: "600",
    marginBottom: 10,
  },

  /* Section labels */
  sectionLabel: {
    fontWeight: "700",
    fontSize: 13,
    color: "#333",
    marginBottom: 6,
  },

  /* Podium toggle */
  podiumToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleOn: { backgroundColor: "#2E7D32" },
  toggleOff: { backgroundColor: "#B71C1C" },
  toggleBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* Podium + Next Speaker row */
  podiumAndNextRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 12,
  },

  /* Podium */
  podiumWrapper: {
    alignItems: "center",
    flex: 1,
  },
  lectern: {
    alignItems: "center",
    position: "relative",
    width: 120,
  },
  lecternTop: {
    width: 110,
    height: 10,
    backgroundColor: PODIUM_DARK,
    borderRadius: 4,
  },
  lecternBody: {
    width: 90,
    height: 80,
    backgroundColor: PODIUM_BROWN,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  lecternPanel: {
    width: 70,
    height: 55,
    borderWidth: 2,
    borderColor: PODIUM_DARK,
    borderRadius: 4,
    backgroundColor: "#A0703A",
  },
  lecternBase: {
width: 120,
    height: 14,
    backgroundColor: PODIUM_DARK,
    borderRadius: 4,
  },
  micStandContainer: {
    position: "absolute",
    alignItems: "center",
    right: -14,
  },
  micHead: {
    width: 20,
    height: 28,
    borderRadius: 10,
    backgroundColor: MIC_SILVER,
    borderWidth: 1,
    borderColor: "#888",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  micMesh: {
    width: 12,
    height: 18,
    borderWidth: 0.5,
    borderColor: "#666",
    borderRadius: 6,
    backgroundColor: "#C8C8C8",
  },
  micNeck: {
    width: 3,
    height: 40,
    backgroundColor: "#999",
    borderRadius: 2,
  },
  micBase: {
    width: 18,
    height: 6,
    backgroundColor: "#888",
    borderRadius: 3,
  },
  speakerOnPodium: {
    position: "absolute",
    top: -52,
    alignSelf: "center",
  },
  speakerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  liveCamPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E53935",
  },
  liveCamText: { color: "#E53935", fontWeight: "900", fontSize: 11 },
  emptyPodiumCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPodiumText: { fontSize: 10, color: "#999" },
  speakerNameOnPodium: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    maxWidth: 120,
  },

  /* Next Speaker panel */
  nextSpeakerPanel: {
    flex: 1,
    alignItems: "center",
  },
  nextSpeakerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
  },
  nextSpeakerCard: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1565C0",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#E3F2FD",
    width: 100,
  },
  nextSpeakerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 4,
  },
  nextSpeakerName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    textAlign: "center",
  },
  hostRemarksIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF9C4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  nextSpeakerEmpty: {
    width: 100,
    height: 80,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  nextSpeakerEmptyText: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  selectNextBtn: {
    marginTop: 8,
    backgroundColor: "#1565C0",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectNextBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  /* Camera & Finished */
  cameraToggleBtn: {
    backgroundColor: "#37474F",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  cameraToggleActive: { backgroundColor: "#BF360C" },
  cameraToggleText: { color: "#fff", fontWeight: "700" },
  finishedBtn: {
    backgroundColor: "#388E3C",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  finishedBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  /* AI Box */
  aiBox: {
    backgroundColor: AI_BG,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#3F51B5",
  },
  aiBoxTitle: { fontWeight: "800", fontSize: 13, color: "#3F51B5", marginBottom: 4 },
  aiBoxMsg: { fontSize: 13, color: "#333", lineHeight: 19 },

  /* VIP Section */
  vipSection: {
    marginBottom: 14,
    borderWidth: 2,
    borderColor: VIP_RED,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FFF5F5",
  },
  vipScroll: { marginTop: 4 },
  emptyVipText: { color: "#999", padding: 10, fontSize: 12 },

  /* Member Card */
  memberCard: {
    alignItems: "center",
    padding: 6,
    margin: 4,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 66,
  },
  memberCardVIP: {
    borderWidth: 2,
    borderColor: VIP_RED,
  },
  memberCardSpeaking: {
    borderWidth: 2,
    borderColor: "#388E3C",
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberName: {
    fontSize: 10,
    color: "#333",
    marginTop: 3,
    maxWidth: 60,
    textAlign: "center",
  },
  micIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#388E3C",
    borderRadius: 8,
    padding: 2,
  },
  removeTag: {
    marginTop: 4,
    backgroundColor: VIP_RED,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removeTagText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  /* VIP badge */
  vipBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: VIP_RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  vipBadgeText: { color: "#fff", fontSize: 6, fontWeight: "900" },

  /* Search */
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  searchDropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
    maxHeight: 200,
  },
  searchDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 8,
  },
  dropdownAvatar: { width: 30, height: 30, borderRadius: 15 },

  /* Queue */
  queueSection: { marginBottom: 12 },
  queueItem: {
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#388E3C",
  },
  queueItemText: { fontWeight: "600", color: "#1B5E20" },

  /* Raise hand */
  raiseHandBtn: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#1565C0",
  },
  raiseHandText: { color: "#1565C0", fontWeight: "700", fontSize: 14 },

  /* Members section */
  membersSection: { marginBottom: 14 },
  loadingMore: { padding: 10, alignItems: "center" },

  /* Reactions */
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 30,
  },
  reactionBtn: { alignItems: "center", flexDirection: "row", gap: 4 },
  reactionIcon: { fontSize: 22 },
  reactionCount: { fontSize: 13, color: "#555", fontWeight: "600" },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: "80%",
  },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 12, color: "#111" },
  hostRemarksOption: {
    backgroundColor: "#FFF9C4",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#F9A825",
  },
  hostRemarksOptionText: { fontWeight: "700", color: "#F57F17", fontSize: 13 },
  nextSpeakerListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 10,
  },
  vipTagInline: {
    backgroundColor: VIP_RED,
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  closeModalBtn: {
    marginTop: 12,
    backgroundColor: "#ECEFF1",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeModalBtnText: { fontWeight: "700", color: "#333" },

  /* Comments */
  commentItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  commentAuthor: { fontWeight: "700", fontSize: 12, color: "#555", marginBottom: 2 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#fff",
  },
  sendBtn: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  sendBtnText: { color: "#fff", fontWeight: "700" },
});
