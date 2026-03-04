(async function() {
  var cid = crypto.randomUUID();
  var answers = [
    "I work in data and technology, helping organizations make sense of complex information.",
    "What drives me most is the feeling of unlocking potential in people and systems that others overlook.",
    "My family is everything to me. I have a deep connection with my partner and kids that grounds me.",
    "I struggle with slowing down. I always feel like there is more to build, more to explore.",
    "Music and nature. Playing guitar in the evening or walking in the woods completely resets me."
  ];

  console.log("Starting automated conversation...");

  async function readStream(response) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var text = "";
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      var chunk = decoder.decode(result.value, { stream: true });
      var lines = chunk.split("\n");
      for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (line.indexOf("data: ") === 0 && line !== "data: [DONE]") {
          try {
            var d = JSON.parse(line.slice(6));
            if (d.text) text += d.text;
          } catch (e) {}
        }
      }
    }
    return text;
  }

  var res = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "[Starting a new conversation]", inputType: "text", conversationId: cid })
  });
  var question = await readStream(res);
  console.log("Q1: " + question);

  var messages = [];
  for (var i = 0; i < answers.length; i++) {
    messages.push({ role: "agent", content: question });
    messages.push({ role: "user", content: answers[i] });
    console.log("A" + (i + 1) + ": " + answers[i]);

    res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: answers[i],
        inputType: "text",
        conversationId: cid,
        recentMessages: messages.slice(-20).map(function(m) { return { role: m.role, content: m.content }; })
      })
    });
    question = await readStream(res);
    console.log("Q" + (i + 2) + ": " + question);
  }

  console.log("Triggering understanding extraction...");
  var extractRes = await fetch("/api/understanding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: cid,
      messages: messages.map(function(m) { return { role: m.role, content: m.content }; }),
      startedAt: new Date().toISOString()
    })
  });
  var extractData = await extractRes.json();
  console.log("Extraction: " + extractRes.status + " " + JSON.stringify(extractData));

  console.log("Checking debug...");
  var debugRes = await fetch("/api/debug");
  var debugData = await debugRes.json();
  console.log("Debug: " + JSON.stringify(debugData, null, 2));

  console.log("Requesting reflection...");
  var reflRes = await fetch("/api/reflections", { method: "POST" });
  var reflData = await reflRes.json();
  console.log("Reflection: " + reflRes.status + " " + JSON.stringify(reflData));

  console.log("Done!");
})();
