"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/core/ui/avatar";
import type { StoredAccount } from "@/store/auth.store";

interface LogoutSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: StoredAccount[];
  onSelect: (userId: string) => void;
  onCancel: () => void;
}

const getInitials = (name: string) => {
  return name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
};

export function LogoutSwitchModal({
  open,
  onOpenChange,
  accounts,
  onSelect,
  onCancel,
}: LogoutSwitchModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-sm rounded-xl overflow-hidden border border-zinc-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Switch Account
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            You are logging out of your current account. Since you have multiple
            other accounts logged in, please select which account you want to
            switch to:
          </DialogDescription>
        </DialogHeader>

        {/* Accounts List */}
        <div className="my-4 max-h-60 overflow-y-auto pr-1 space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.user.id}
              onClick={() => onSelect(acc.user.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-left transition-all duration-200 hover:border-zinc-200 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.99] dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
            >
              <Avatar className="h-10 w-10 border border-zinc-200/60 dark:border-zinc-800/60">
                <AvatarImage src={acc.user.image ?? ""} alt={acc.user.name} />
                <AvatarFallback className="bg-zinc-200/50 text-zinc-700 font-semibold dark:bg-zinc-800/50 dark:text-zinc-300">
                  {getInitials(acc.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-zinc-950 dark:text-zinc-200">
                  {acc.user.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {acc.user.email}
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {acc.user.roleName || acc.user.role}
                </span>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="sm:justify-end gap-2 border-t border-zinc-100/80 pt-4 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300"
          >
            Cancel Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
