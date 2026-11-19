import { createRoot } from "react-dom/client";
import { useState } from "react";
import Home from "@/app/(root)/(home)/page";
import PersonalRoom from "@/app/(root)/(home)/personal-room/page";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CallList from "@/components/CallList";
import MeetingSetup from "@/components/MeetingSetup";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "./router";
import "@/app/globals.css";
import "react-datepicker/dist/react-datepicker.css";
function App() {
  const path = usePathname();
  const [joined, setJoined] = useState(false);
  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          zIndex: 100,
          background: "#101421",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        Offline preview · sample data
      </div>
      {path.startsWith("/meeting/") ? (
        joined ? (
          <main className="flex min-h-screen items-center justify-center text-white">
            <p>Joined sample meeting. Live video requires the real services.</p>
          </main>
        ) : (
          <MeetingSetup setIsSetupComplete={setJoined} />
        )
      ) : (
        <main className="relative">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <section className="flex flex-col flex-1 min-h-screen px-6 pb-6 pt-28 max-md:pb-14 sm:px-14">
              <div className="w-full">
                {path === "/personal-room" ? (
                  <PersonalRoom />
                ) : path === "/upcoming" ? (
                  <CallList type="upcoming" />
                ) : path === "/previous" ? (
                  <CallList type="ended" />
                ) : path === "/recordings" ? (
                  <CallList type="recordings" />
                ) : (
                  <Home />
                )}
              </div>
            </section>
          </div>
        </main>
      )}
      <Toaster />
    </>
  );
}
document.body.classList.add("bg-dark-2");
createRoot(document.getElementById("root")!).render(<App />);
