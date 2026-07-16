import { useState } from "react";

export function useJournalEditor(
  currentText: string,
  onSave: (text: string) => void,
) {
  const [editingText, setEditingText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);

  const openJournal = () => {
    setEditingText(currentText);
    setJournalOpen(true);
  };

  const closeJournal = () => {
    setJournalOpen(false);
    onSave(editingText);
  };

  return { editingText, setEditingText, journalOpen, openJournal, closeJournal };
}
