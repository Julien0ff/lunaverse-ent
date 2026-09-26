require('dotenv').config({ path: '.env.local' });
const token = process.env.DISCORD_BOT_TOKEN;

async function test() {
  const channel = '1504976034750271678';
  const payload = {
    content: "Test",
    embeds: [{
      title: "Test",
      description: "**Salle de cours :** <#123456>",
      color: 0xED4245
    }]
  };
  
  const res = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    console.error(await res.text());
  } else {
    console.log("Success", await res.json());
  }
}
test();
