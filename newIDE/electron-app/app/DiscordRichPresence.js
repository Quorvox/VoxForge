const { Client } = require('@xhayper/discord-rpc');

// VoxForge: свой Application ID из https://discord.com/developers/applications.
// Пока он не задан, статус в Discord не показываем (раньше тут был ID GDevelop
// и в профиле писалось «GDevelop»).
const clientId = process.env.VOXFORGE_DISCORD_CLIENT_ID || '';

let discordClient = null;
if (clientId) {
  discordClient = new Client({ clientId });
  discordClient.on('error', _ => true); // Ошибки бывают, если Discord не установлен
  discordClient.login().catch(() => {
    // Discord может быть не установлен
  });
}

module.exports = function(ipc) {
  ipc.on('update-discord-rich-presence', (event, config) => {
    if (discordClient && discordClient.user) {
      discordClient.user.setActivity(config).catch(() => {
        // Тихо игнорируем
      });
    }
  });
};
