export default function LetsTalkRoom() {

  const hostId = "host123";
  const currentUserId = "user999";

  /* ===============================
     STATE
  =============================== */

  const [countdown, setCountdown] = useState<number>(0);
  const [scheduledTime] = useState<number>(Date.now() + 7200000);

  const [members, setMembers] = useState<Member[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [talkQueue, setTalkQueue] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string>(
    "Welcome to Let's Talk 🎙"
  );

  /* ===============================
     LOAD MEMBERS (PAGINATION)
  =============================== */

  const loadMembers = async () => {
    const snapshot = await fetchMembers("room123", lastDoc);

    const newMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    setMembers(prev => [...prev, ...newMembers]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  /* ===============================
     COUNTDOWN TIMER
  =============================== */

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = scheduledTime - now;
      setCountdown(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  /* ===============================
     SPEAK SYSTEM
  =============================== */

  const requestToSpeak = () => {
    if (!talkQueue.includes(currentUserId)) {
      setTalkQueue(prev => [...prev, currentUserId]);
    }
  };

  const grantMic = (userId: string) => {
    setMembers(prev =>
      prev.map(member =>
        member.id === userId
          ? { ...member, hasMic: true, isSpeaking: true }
          : member
      )
    );

    setTalkQueue(prev => prev.filter(id => id !== userId));

    const speaker = members.find(m => m.id === userId);
    setAiMessage(
      `Next speaker is ${speaker?.name}. Please begin 🎤`
    );
  };

  const toggleVIP = (userId: string) => {
    if (currentUserId !== hostId) return;

    setMembers(prev =>
      prev.map(member =>
        member.id === userId
          ? { ...member, isVIP: !member.isVIP }
          : member
      )
    );
  };

  const sortedMembers = [
    ...members.filter(m => m.isVIP),
    ...members.filter(m => !m.isVIP),
  ];

  /* ===============================
     UI
  =============================== */

  return (
    <View style={{ flex: 1, padding: 15 }}>

      {/* COUNTDOWN */}
      <Text style={{ fontSize: 16, color: "red" }}>
        {Math.floor(countdown / (1000 * 60))} min{" "}
        {Math.floor((countdown / 1000) % 60)} sec
      </Text>

      {/* AI ANNOUNCER */}
      <View
        style={{
          backgroundColor: "#f2f2f2",
          padding: 10,
          marginVertical: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontWeight: "bold" }}>
          🤖 AI Program Assistant
        </Text>
        <Text>{aiMessage}</Text>
      </View>

      {/* MEMBERS LIST WITH PAGINATION */}
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id}
        horizontal
        onEndReached={loadMembers}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleVIP(item.id)}
            style={{
              padding: 6,
              margin: 4,
              borderWidth: item.isVIP ? 2 : 0,
              borderColor: item.isVIP ? "red" : "transparent",
              borderRadius: 6,
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: item.avatar }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
              }}
            />
            <Text>{item.name}</Text>

            {item.isVIP && <Text>✔ VIP</Text>}
            {item.hasMic && <Text>🎤</Text>}
          </TouchableOpacity>
        )}
      />

      {/* RAISE HAND */}
      {currentUserId !== hostId && (
        <TouchableOpacity onPress={requestToSpeak}>
          <Text style={{ color: "blue", marginTop: 15 }}>
            ✋ Raise Hand
          </Text>
        </TouchableOpacity>
      )}

      {/* HOST QUEUE */}
      {currentUserId === hostId && talkQueue.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold" }}>
            🔔 Speaking Requests:
          </Text>

          {talkQueue.map((id) => {
            const user = members.find(m => m.id === id);
            return (
              <TouchableOpacity
                key={id}
                onPress={() => grantMic(id)}
                style={{
                  backgroundColor: "#ddd",
                  padding: 8,
                  marginVertical: 5,
                  borderRadius: 6,
                }}
              >
                <Text>
                  Grant mic to {user?.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

    </View>
  );
}

  

   




  
    
