import 'server-only';

/**
 * Discord-side integrations for the engagement hub. Every function is a no-op
 * when its env vars are missing, so the site never depends on the bot.
 */

const DISCORD_API = 'https://discord.com/api/v10';

function botToken(): string {
  return process.env.DISCORD_BOT_TOKEN ?? '';
}

export function isDiscordBotConfigured(): boolean {
  return Boolean(botToken() && process.env.DISCORD_GUILD_ID);
}

export function isLegendRoleConfigured(): boolean {
  return isDiscordBotConfigured() && Boolean(process.env.DISCORD_LEGEND_ROLE_ID);
}

async function botFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

/** Grants the Site Legend role. Returns false when unconfigured or Discord rejects. */
export async function grantLegendRole(discordId: string): Promise<boolean> {
  if (!isLegendRoleConfigured()) return false;

  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_LEGEND_ROLE_ID;

  try {
    const res = await botFetch(`/guilds/${guildId}/members/${discordId}/roles/${roleId}`, {
      method: 'PUT',
    });
    if (!res.ok) {
      console.error(`Failed to grant legend role (${res.status}):`, await res.text());
    }
    return res.ok;
  } catch (error) {
    console.error('Failed to grant legend role:', error);
    return false;
  }
}

/** Mirrors a site feed event into the configured Discord channel via webhook. */
export async function postToFeedChannel(content: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_FEED_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        // Feed messages quote usernames; never let them ping roles/everyone.
        allowed_mentions: { parse: [] },
      }),
    });
  } catch (error) {
    console.error('Failed to post to Discord feed channel:', error);
  }
}

/** Sends a DM. Fails quietly when the user blocks DMs or doesn't share the guild. */
export async function sendDirectMessage(discordId: string, content: string): Promise<boolean> {
  if (!botToken()) return false;

  try {
    const channelRes = await botFetch('/users/@me/channels', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: discordId }),
    });
    if (!channelRes.ok) return false;

    const channel = await channelRes.json();
    const messageRes = await botFetch(`/channels/${channel.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return messageRes.ok;
  } catch (error) {
    console.error('Failed to send Discord DM:', error);
    return false;
  }
}
