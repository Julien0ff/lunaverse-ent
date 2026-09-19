require('dotenv').config();
const token = process.env.DISCORD_BOT_TOKEN;
const channel = '1504976034750271678';
async function test() {
  const res = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: "Test message" })
  });
  console.log(res.status, await res.text());
}
test();
