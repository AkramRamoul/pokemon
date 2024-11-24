"use client";
import { useRouter } from "next/navigation";
const RedirectButton = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/results")}
      className="px-8 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors max-w-48 "
    >
      View results
    </button>
  );
};

export default RedirectButton;
