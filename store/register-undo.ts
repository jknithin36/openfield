// Importing this module registers every store's undo with the undo registry.
import { registerUndo } from "@/lib/undo-registry";
import { useLibraryStore } from "@/store/library";
import { useEventsStore } from "@/store/events";

registerUndo((id) => useLibraryStore.getState().undo(id));
registerUndo((id) => useEventsStore.getState().undo(id));
import { useContactsStore } from "@/store/contacts";
import { useInboxStore } from "@/store/inbox";
import { useContentStore } from "@/store/content";
import { useSettingsStore } from "@/store/settings";

registerUndo((id) => useContactsStore.getState().undo(id));
registerUndo((id) => useInboxStore.getState().undo(id));
registerUndo((id) => useContentStore.getState().undo(id));
registerUndo((id) => useSettingsStore.getState().undo(id));
