const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "channels.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Load channels from file
function loadChannels() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Save channels to file
function saveChannels(channels) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(channels, null, 2));
}

// Fetch YouTube RSS feed for a channel
function fetchFeed(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch feed for ${channelId}: ${res.statusCode}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        xml2js.parseString(data, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }).on("error", reject);
  });
}

// API: Get all channels
app.get("/api/channels", (req, res) => {
  res.json(loadChannels());
});

// API: Add a channel
app.post("/api/channels", async (req, res) => {
  const { channelId, name } = req.body;
  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  const channels = loadChannels();
  if (channels.some((c) => c.channelId === channelId)) {
    return res.status(409).json({ error: "Channel already added" });
  }

  // Verify the channel exists by trying to fetch its feed
  let channelName = name || channelId;
  try {
    const feed = await fetchFeed(channelId);
    if (feed.feed && feed.feed.title) {
      channelName = feed.feed.title[0];
    }
  } catch {
    return res.status(404).json({ error: "Could not find YouTube channel with that ID" });
  }

  channels.push({ channelId, name: channelName, addedAt: new Date().toISOString() });
  saveChannels(channels);
  res.status(201).json({ channelId, name: channelName });
});

// API: Remove a channel
app.delete("/api/channels/:channelId", (req, res) => {
  let channels = loadChannels();
  const before = channels.length;
  channels = channels.filter((c) => c.channelId !== req.params.channelId);
  if (channels.length === before) {
    return res.status(404).json({ error: "Channel not found" });
  }
  saveChannels(channels);
  res.json({ success: true });
});

// API: Get latest videos from all channels
app.get("/api/videos", async (req, res) => {
  const channels = loadChannels();
  const allVideos = [];

  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      try {
        const feed = await fetchFeed(channel.channelId);
        const entries = feed.feed?.entry || [];
        return entries.slice(0, 5).map((entry) => ({
          title: entry.title?.[0] || "Untitled",
          videoId: entry["yt:videoId"]?.[0] || "",
          channelName: entry.author?.[0]?.name?.[0] || channel.name,
          published: entry.published?.[0] || "",
          thumbnail: `https://i.ytimg.com/vi/${entry["yt:videoId"]?.[0]}/mqdefault.jpg`,
          link: entry.link?.[0]?.["$"]?.href || "",
        }));
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allVideos.push(...result.value);
    }
  }

  // Sort by published date, newest first
  allVideos.sort((a, b) => new Date(b.published) - new Date(a.published));
  res.json(allVideos);
});

app.listen(PORT, () => {
  console.log(`YouTube Aggregator running at http://localhost:${PORT}`);
});
