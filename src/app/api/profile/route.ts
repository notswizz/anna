import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device";
import { getStore } from "@/lib/store";
import { computeTargets, isValidProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

export async function GET() {
  const store = getStore(await getDeviceId());
  const profile = await store.getProfile();
  return NextResponse.json({
    profile,
    targets: profile ? computeTargets(profile) : null,
  });
}

/** Save the profile and apply its computed targets as the daily goals. */
export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<Profile>;
  if (!isValidProfile(body)) {
    return NextResponse.json(
      { error: "Profile needs valid height, weight, age, sex, activity, and goal." },
      { status: 400 }
    );
  }

  const profile: Profile = {
    heightIn: Math.round(body.heightIn),
    weightLb: Math.round(body.weightLb),
    age: Math.round(body.age),
    sex: body.sex,
    activity: body.activity,
    goal: body.goal,
  };

  const store = getStore(await getDeviceId());
  const targets = computeTargets(profile);
  await store.setProfile(profile);
  await store.setGoals({
    calories: targets.calories,
    protein_g: targets.protein_g,
    carbs_g: targets.carbs_g,
    fat_g: targets.fat_g,
  });

  return NextResponse.json({ profile, targets });
}
