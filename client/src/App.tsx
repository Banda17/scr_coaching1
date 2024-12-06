import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Schedules from "./pages/Schedules";
import SheetsView from "./pages/SheetsView";
import AuthPage from "./pages/AuthPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "./hooks/use-user";

const queryClient = new QueryClient();

export default function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto p-4">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/schedules" component={Schedules} />
            <Route path="/sheets" component={SheetsView} />
            <Route>404 Page Not Found</Route>
          </Switch>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
