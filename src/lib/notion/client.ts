import { Client } from "@notionhq/client";

export const createNotionClient = (accessToken: string): Client => {
  return new Client({ auth: accessToken });
};
