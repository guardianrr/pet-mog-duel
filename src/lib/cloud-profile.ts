import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, saveProfile, type Profile } from "@/lib/petmog";

/** Persist locally, and mirror to the cloud when the visitor is signed in. */
export async function saveProfileSynced(profile: Profile) {
  saveProfile(profile);
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  await supabase.from("profiles").upsert({
    id: userId,
    username: profile.username,
    pet_name: profile.petName,
    elo: profile.elo,
    peak_elo: profile.peakElo,
    wins: profile.wins,
    losses: profile.losses,
  });
}

/** Fire-and-forget variant for UI callbacks. */
export function persistProfile(profile: Profile) {
  void saveProfileSynced(profile).catch(() => {
    /* offline / not signed in — local copy is already saved */
  });
}

/**
 * Pulls the signed-in account's stats into local state once the user is known,
 * seeding the cloud row from local stats the first time.
 */
export function useCloudProfileSync(
  userId: string | undefined,
  apply: (profile: Profile) => void,
) {
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, pet_name, elo, peak_elo, wins, losses")
        .eq("id", userId)
        .maybeSingle();
      if (!active || error) return;
      const local = loadProfile();
      if (!data) {
        void saveProfileSynced(local);
        return;
      }
      const merged: Profile = {
        ...local,
        username: data.username,
        petName: data.pet_name,
        elo: data.elo,
        peakElo: data.peak_elo,
        wins: data.wins,
        losses: data.losses,
      };
      saveProfile(merged);
      apply(merged);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
