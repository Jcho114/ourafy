import LockIn from "@/pages/LockIn";
import Snapshot from "@/pages/Snapshot";
import Pomodoro from "@/pages/Pomodoro";
import Plan from "@/pages/Plan";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider delayDuration={150}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LockIn />} />
              <Route path="/lock-in" element={<LockIn />} />
              <Route path="/snapshot" element={<Snapshot />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
