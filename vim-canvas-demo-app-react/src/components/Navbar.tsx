import { useVimOsContext } from "@/hooks/useVimOsContext";
import { Cross2Icon, ExitIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
// import { Separator } from "./ui/separator";
import { useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useAuth } from "@/auth";
import { useToast } from "@/hooks/use-toast";
import scribeLogo from "@/assets/ScribeAI_SS1H.png";

export const Navbar = () => {
  const vimOs = useVimOsContext();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleAppClose = useCallback(() => {
    vimOs.hub.closeApp();
  }, [vimOs.hub]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({
        variant: "default",
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out",
      });
    }
  }, [logout, toast]);

  return (
    <div className="px-2 pl-4 py-2 bg-scribe-blue flex justify-between items-center space-x-2">
      <div>
        {/* <h2 className="text-sm text-scribe-white">ScribeAI</h2> */}
        <img src={scribeLogo} alt="ScribeAI Logo" className="w-36" />
      </div>
      <div className="flex items-center h-full space-x-1">
        <TooltipProvider>
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant="ghost"
                  className="p-1 h-fit hover:bg-red-100/60"
                  onClick={handleLogout}
                >
                  <ExitIcon className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-primary text-primary-foreground">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant="ghost"
                className="p-1 h-fit hover:bg-green-100/60"
              >
                <Cross2Icon className="w-6 h-6" onClick={handleAppClose} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-primary text-primary-foreground">
              <p>Close app</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
