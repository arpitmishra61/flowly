export default async function createIssue({
  token,
  repo,
  title,
  body,
}: Record<"token" | "repo" | "title" | "body", string>) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body }),
    });

    if (!res.ok) {
      console.log("Error creating issue", await res.text());
      return false;
    }

    return await res.json();
  } catch (err) {
    console.log("Error creating issue", err);
    return false;
  }
}
