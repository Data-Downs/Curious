(async function() {
  console.log("Creating a gift...");
  var res = await fetch("/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail: "testrecipient@example.com",
      relationshipLabel: "close friend",
      briefing: "This person is deeply thoughtful and creative. They have an incredible ability to see patterns others miss, connecting ideas from technology, art, and philosophy. They care deeply about building things that matter and often wrestle with balancing ambition and presence. Music is their reset button, and nature grounds them. They light up when talking about unlocking potential in others."
    })
  });
  var data = await res.json();
  console.log("Gift result: " + res.status + " " + JSON.stringify(data, null, 2));
  if (data.inviteCode) {
    var url = window.location.origin + "/gift/" + data.inviteCode;
    console.log("CLAIM URL: " + url);
    console.log("Open this URL in Safari to test claiming as a different user.");
  }
  console.log("Done!");
})();
