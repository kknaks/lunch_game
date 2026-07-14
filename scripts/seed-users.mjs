import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const initialPassword = process.env.INITIAL_PASSWORD ?? "1234";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = JSON.parse(
  await readFile(new URL("../supabase/company-users.json", import.meta.url), "utf8"),
).filter((user) => user.active);

for (const user of users) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      display_name: user.name,
      source_user_id: user.source_user_id,
    },
  });

  let authUser = created.user;

  if (error && !error.message.toLowerCase().includes("already")) {
    console.error(`failed: ${user.email}`, error.message);
    continue;
  }

  if (!authUser) {
    const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`failed to list users for ${user.email}`, listError.message);
      continue;
    }
    authUser = listed.users.find((item) => item.email === user.email);
  }

  if (!authUser) {
    console.error(`missing auth user: ${user.email}`);
    continue;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authUser.id,
    email: user.email,
    display_name: user.name,
    source_user_id: user.source_user_id,
    department: user.department,
    position: user.position,
    role: user.role,
    active: user.active,
  });

  if (profileError) {
    console.error(`profile failed: ${user.email}`, profileError.message);
    continue;
  }

  console.log(`seeded: ${user.email}`);
}
