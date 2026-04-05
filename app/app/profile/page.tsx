import ProfileReviewer from "@/components/ProfileReviewer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile Review - Dating Assistant",
};

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Optimize Your Profile</h1>
        <p className="text-gray-600">Get AI-powered feedback on your bio to stand out.</p>
      </div>

      <ProfileReviewer />
    </div>
  );
}
