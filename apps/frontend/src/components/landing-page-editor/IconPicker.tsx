// apps/frontend/src/components/landing-page-editor/IconPicker.tsx

"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as LucideIcons from "lucide-react"; // Import all icons
import { Search, X } from "lucide-react";

// A comprehensive list of Lucide icon names (can be expanded)
const lucideIconNames = [
  "Activity", "AirVent", "AlarmClock", "Album", "AlertCircle", "AlertOctagon", "AlertTriangle",
  "AlignCenter", "AlignJustify", "AlignLeft", "AlignRight", "Anchor", "Annoyed", "Aperture",
  "Apple", "Archive", "ArrowBigDown", "ArrowBigLeft", "ArrowBigRight", "ArrowBigUp",
  "ArrowDown", "ArrowDownCircle", "ArrowDownLeft", "ArrowDownRight", "ArrowLeft",
  "ArrowLeftCircle", "ArrowRight", "ArrowRightCircle", "ArrowUp", "ArrowUpCircle",
  "ArrowUpLeft", "ArrowUpRight", "AtSign", "Award", "Baby", "Backpack", "Badge", "BaggageClaim",
  "Ban", "Banknote", "BarChart", "BarChart2", "BarChart3", "BarChart4", "BarChartBig",
  "BarChartHorizontal", "BarChartHorizontalBig", "Baseline", "Bath", "Battery",
  "BatteryCharging", "BatteryFull", "BatteryLow", "BatteryMedium", "BatteryWarning",
  "Beaker", "Bed", "Beer", "Bell", "BellDot", "BellMinus", "BellOff", "BellPlus", "BellRing",
  "Bike", "Binary", "Bird", "Bitcoin", "Blinds", "Blocks", "Bluetooth", "BluetoothConnected",
  "BluetoothOff", "BluetoothSearching", "Bold", "Bomb", "Bone", "Book", "BookA", "BookCheck",
  "BookCopy", "BookDashed", "BookDown", "BookKey", "BookLock", "BookMarked", "BookMinus",
  "BookOpen", "BookOpenCheck", "BookPlus", "BookText", "BookUp", "BookX", "Bookmark",
  "BookmarkMinus", "BookmarkPlus", "BookmarkX", "BoomBox", "Bot", "Box", "BoxSelect", "Boxes",
  "Brackets", "Brain", "Briefcase", "Brush", "Bug", "Building", "Building2", "Bus", "BaggageClaim",
  "Cake", "Calculator", "Calendar", "CalendarCheck", "CalendarCheck2", "CalendarClock",
  "CalendarDays", "CalendarHeart", "CalendarMinus", "CalendarOff", "CalendarPlus",
  "CalendarRange", "CalendarSearch", "CalendarX", "Camera", "CameraOff", "CandlestickChart",
  "Car", "CarFront", "CarTaxiFront", "Carrot", "CaseSensitive", "CassetteDisc", "Cast",
  "Castle", "Cat", "Check", "CheckCircle", "CheckCircle2", "CheckSquare", "ChefHat",
  "Cherry", "ChevronDown", "ChevronFirst", "ChevronLast", "ChevronLeft", "ChevronRight",
  "ChevronUp", "ChevronsDown", "ChevronsDownUp", "ChevronsLeft", "ChevronsRight",
  "ChevronsUp", "ChevronsUpDown", "Chrome", "Circle", "CircleDashed", "CircleDot",
  "CircleDotDashed", "CircleEllipsis", "CircleEqual", "CircleOff", "CircleSlash",
  "CircleSlash2", "CircuitBoard", "Citrus", "Clapperboard", "Clipboard", "ClipboardCheck",
  "ClipboardCopy", "ClipboardList", "ClipboardPaste", "ClipboardPen", "ClipboardType",
  "ClipboardX", "Clock", "Clock1", "Clock10", "Clock11", "Clock12", "Clock2", "Clock3",
  "Clock4", "Clock5", "Clock6", "Clock7", "Clock8", "Clock9", "Cloud", "CloudDrizzle",
  "CloudFog", "CloudHail", "CloudLightning", "CloudOff", "CloudRain", "CloudSnow",
  "CloudSun", "Cloudy", "Clover", "Code", "Code2", "CodeSandbox", "Codepen", "Codesandbox",
  "Coffee", "Cog", "Coins", "Columns", "Combine", "Command", "Compass", "Component",
  "ConciergeBell", "Construction", "Contact", "Contact2", "Container", "Contrast", "Cookie",
  "Copy", "CopyCheck", "CopyMinus", "CopyPlus", "CopySlash", "CopyX", "Copyleft", "Copyright",
  "CornerDownLeft", "CornerDownRight", "CornerLeftDown", "CornerLeftUp", "CornerRightDown",
  "CornerRightUp", "CornerUpLeft", "CornerUpRight", "Cpu", "CreditCard", "Crop", "Cross",
  "Crosshair", "Crown", "Cube", "CupSoda", "Currency", "Database", "DatabaseBackup",
  "Delete", "Dessert", "Diamond", "Dice1", "Dice2", "Dice3", "Dice4", "Dice5", "Dice6",
  "Dices", "Diff", "Disc", "Disc2", "Disc3", "Divide", "DivideCircle", "DivideSquare",
  "Dna", "Dog", "DollarSign", "DoorClosed", "DoorOpen", "Dot", "Download", "DownloadCloud",
  "Dribbble", "Droplet", "Droplets", "Drumstick", "Dumbbell", "Ear", "EarOff", "Edit",
  "Edit2", "Edit3", "Egg", "EggFried", "Equal", "EqualNot", "Eraser", "Euro", "Expand",
  "ExternalLink", "Eye", "EyeOff", "Facebook", "Factory", "Fan", "FastForward", "Feather",
  "Figma", "File", "FileArchive", "FileAudio", "FileAudio2", "FileBadge", "FileBadge2",
  "FileBarChart", "FileBarChart2", "FileBox", "FileCheck", "FileCheck2", "FileClock",
  "FileCode", "FileCog", "FileDiff", "FileDigit", "FileDown", "FileEdit", "FileHeart",
  "FileImage", "FileKey", "FileLock", "FileMinus", "FileMinus2", "FileOutput", "FilePen",
  "FilePlus", "FilePlus2", "FileQuestion", "FileScan", "FileSearch", "FileSliders",
  "FileSpreadsheet", "FileStack", "FileSymlink", "FileTerminal", "FileText", "FileType",
  "FileUp", "FileVideo", "FileVideo2", "FileVolume", "FileVolume2", "FileWarning", "FileX",
  "FileX2", "Files", "Film", "Filter", "FilterFunnel", "FilterX", "Fingerprint", "Fish",
  "FishOff", "Flag", "FlagOff", "FlagTriangleLeft", "FlagTriangleRight", "Flame", "Flashlight",
  "FlashlightOff", "Flask", "FlipHorizontal", "FlipVertical", "Flower", "Flower2", "Focus",
  "FoldHorizontal", "FoldVertical", "Folder", "FolderArchive", "FolderCheck", "FolderClock",
  "FolderClosed", "FolderCog", "FolderDot", "FolderDown", "FolderEdit", "FolderGit",
  "FolderGit2", "FolderHeart", "FolderInput", "FolderKanban", "FolderKey", "FolderLock",
  "FolderMinus", "FolderOpen", "FolderOutput", "FolderPen", "FolderPlus", "FolderSearch",
  "FolderSearch2", "FolderSymlink", "FolderSync", "FolderTree", "FolderUp", "FolderX",
  "Folders", "Footprints", "Forklift", "FormInput", "Forward", "Frame", "Framer", "Frown",
  "FunctionSquare", "GalleryHorizontal", "GalleryHorizontalEnd", "GalleryVertical",
  "GalleryVerticalEnd", "Gamepad", "GanttChart", "Gauge", "GaugeCircle", "GaugeSquare",
  "Gem", "Ghost", "Gift", "GitBranch", "GitBranchPlus", "GitCommit", "GitCompare",
  "GitFork", "GitGraph", "GitMerge", "GitPullRequest", "GitPullRequestClosed",
  "GitPullRequestDraft", "Github", "Gitlab", "GlassWater", "Glasses", "Globe", "Globe2",
  "Goal", "Grab", "GraduationCap", "Grape", "Grid", "Grid2X2", "Grid3X3", "Grip", "GripHorizontal",
  "GripVertical", "Hammer", "Hand", "HandMetal", "HardDrive", "HardDriveDownload",
  "HardDriveUpload", "HardHat", "Hash", "Haze", "HdmiPort", "Headphones", "Heart",
  "HeartCrack", "HeartHandshake", "HeartOff", "Heater", "HelpCircle", "Hexagon", "Highlighter",
  "History", "Home", "HopOff", "HopOn", "Hourglass", "IceCream", "IceCream2", "Image",
  "ImageDown", "ImageMinus", "ImageOff", "ImagePlus", "ImageUp", "Images", "Import",
  "Inbox", "Indent", "IndianRupee", "Infinity", "Info", "InspectionPanel", "Instagram",
  "Italic", "IterationCcw", "IterationCw", "JapaneseYen", "Joystick", "Kanban", "Key",
  "KeyRound", "Keyboard", "KeyboardOff", "Lamp", "LampCeiling", "LampDesk", "LampFloor",
  "LampWall", "LandPlot", "Landmark", "Languages", "Laptop", "Laptop2", "LaptopMinimal",
  "Lasso", "LassoSelect", "Laugh", "Layers", "Layout", "LayoutDashboard", "LayoutGrid",
  "LayoutList", "LayoutPanelLeft", "LayoutPanelTop", "LayoutTemplate", "Leaf", "LeafyGreen",
  "Library", "LibraryBig", "LifeBuoy", "Lightbulb", "LightbulbOff", "LineChart", "Link",
  "Link2", "Link2Off", "Linkedin", "List", "ListChecks", "ListEnd", "ListFilter", "ListMinus",
  "ListMusic", "ListOrdered", "ListPlus", "ListRestart", "ListStart", "ListTodo", "ListTree",
  "ListVideo", "ListX", "Loader", "Loader2", "Locate", "LocateFixed", "LocateOff", "Lock",
  "LockKeyhole", "LogIn", "LogOut", "Lollipop", "Luggage", "Mails", "Map", "MapPin",
  "MapPinOff", "Maximize", "Maximize2", "Medal", "Megaphone", "MegaphoneOff", "Meh",
  "MemoryStick", "Menu", "MenuSquare", "Merge", "MessageCircle", "MessageSquare",
  "MessageSquareDashed", "MessageSquarePlus", "MessagesSquare", "Mic", "Mic2", "MicOff",
  "Microscope", "Microwave", "Milestone", "Minimize", "Minimize2", "Minus", "MinusCircle",
  "MinusSquare", "Monitor", "MonitorCheck", "MonitorDot", "MonitorDown", "MonitorOff",
  "MonitorPause", "MonitorPlay", "MonitorSmartphone", "MonitorSpeaker", "MonitorUp",
  "MonitorX", "Moon", "MoonStar", "MoreHorizontal", "MoreVertical", "Mountain", "MountainSnow",
  "Mouse", "MousePointer", "MousePointer2", "MousePointerClick", "Move", "Move3d", "MoveDiagonal",
  "MoveDiagonal2", "MoveHorizontal", "MoveVertical", "Music", "Music2", "Music3", "Music4",
  "Navigation", "Navigation2", "Navigation2Off", "NavigationOff", "Network", "Newspaper",
  "Nfc", "Nut", "Octagon", "Option", "Orbit", "Outdent", "Package", "Package2", "PackageCheck",
  "PackageMinus", "PackageOpen", "PackagePlus", "PackageSearch", "PackageX", "Palette",
  "PanelBottom", "PanelBottomClose", "PanelBottomOpen", "PanelLeft", "PanelLeftClose",
  "PanelLeftOpen", "PanelRight", "PanelRightClose", "PanelRightOpen", "PanelTop",
  "PanelTopClose", "PanelTopOpen", "Paperclip", "Parentheses", "ParkingMeter", "PartyPopper",
  "Pause", "PauseCircle", "PauseOctagon", "PawPrint", "PcCase", "Pen", "PenLine", "PenTool",
  "Pencil", "PencilLine", "PencilRuler", "Pentagon", "Percent", "PersonStanding", "Phone",
  "PhoneCall", "PhoneForwarded", "PhoneIncoming", "PhoneMissed", "PhoneOff", "PhoneOutgoing",
  "PhonePaused", "PictureInPicture", "PictureInPicture2", "PieChart", "PiggyBank", "Pin",
  "PinContainer", "PinOff", "Pipette", "Pizza", "Plane", "PlaneLanding", "PlaneTakeoff",
  "Play", "PlayCircle", "PlaySquare", "Plug", "Plug2", "PlugZap", "Plus", "PlusCircle",
  "PlusSquare", "Pocket", "Podcast", "Pointer", "Popcorn", "Popsicle", "PortableWifi",
  "Postcard", "Power", "PowerOff", "Printer", "Projector", "Puzzle", "QrCode", "Quote",
  "Radar", "Radiation", "Radio", "RadioReceiver", "RadioTower", "Radius", "RailSymbol",
  "Rainbow", "Rat", "Receipt", "ReceiptIndianRupee", "ReceiptPoundSterling", "ReceiptRupee",
  "ReceiptText", "ReceiptYen", "ReceiptEuro", "RectangleHorizontal", "RectangleVertical",
  "Recycle", "Redo", "Redo2", "RefreshCcw", "RefreshCcwDot", "RefreshCw", "RefreshCwOff",
  "Regex", "Relay", "RemoveFormatting", "Repeat", "Repeat1", "Repeat2", "Replace",
  "ReplaceAll", "Reply", "ReplyAll", "Rewind", "Ribbon", "Rocket", "RockingChair", "RollerCoaster",
  "Rotate3d", "RotateCcw", "RotateCcwSquare", "RotateCw", "RotateCwSquare", "Route",
  "RouteOff", "Router", "Rows", "Rss", "Ruler", "RussianRubles", "Sailboat", "Salad",
  "Sandwich", "Satellite", "SatelliteDish", "Save", "SaveAll", "Scale", "Scale3d", "Scaling",
  "Scan", "ScanBarcode", "ScanEye", "ScanFace", "ScanLine", "ScanQr", "ScanText", "ScatterChart",
  "School", "School2", "Scissors", "ScreenShare", "ScreenShareOff", "Scroll", "Search",
  "SearchCheck", "SearchCode", "SearchMinus", "SearchPlus", "SearchX", "Send", "SendHorizontal",
  "SendToBack", "SeparatorHorizontal", "SeparatorVertical", "Server", "ServerCog", "ServerCrash",
  "ServerOff", "Settings", "Settings2", "Share", "Share2", "Sheet", "Shield", "ShieldAlert",
  "ShieldBan", "ShieldCheck", "ShieldClose", "ShieldOff", "ShieldQuestion", "ShieldX",
  "Ship", "ShipWheel", "Shirt", "ShoppingBag", "ShoppingBasket", "ShoppingCart", "Shovel",
  "ShowerHead", "Shrink", "Shrub", "Shuffle", "Sigma", "Signal", "SignalHigh", "SignalLow",
  "SignalMedium", "SignalZero", "Siren", "SkipBack", "SkipForward", "Skull", "Slack",
  "Slash", "Slice", "Sliders", "SlidersHorizontal", "Smartphone", "SmartphoneCharging",
  "SmartphoneNfc", "SmartphoneOff", "Smile", "SmilePlus", "Snowflake", "Sofa", "Soup",
  "Space", "Sparkle", "Sparkles", "Speaker", "Speech", "Sprout", "Square", "SquareDashedBottomCode",
  "SquareDashedBottom", "SquareDot", "SquareEqual", "SquareOff", "SquareRoot", "SquareTerminal",
  "SquareUser", "SquareX", "Stack", "StackOld", "Star", "StarHalf", "StarOff", "Stars",
  "Sticker", "StickyNote", "StopCircle", "Store", "StretchHorizontal", "StretchVertical",
  "Strikethrough", "Subscript", "Subtitles", "Sun", "SunDim", "SunMedium", "Sunrise",
  "Sunset", "Superscript", "SwatchBook", "SwissFranc", "SwitchCamera", "Sword", "Swords",
  "Syringe", "Table", "Table2", "TableProperties", "Tablet", "TabletSmartphone", "Tablets",
  "Tag", "Tags", "Target", "Tent", "Terminal", "TerminalSquare", "TestTube", "TestTube2",
  "TestTubes", "Text", "TextAlignCenter", "TextAlignJustify", "TextAlignLeft",
  "TextAlignRight", "TextCursor", "TextCursorInput", "TextQuote", "TextSelect", "Thermometer",
  "ThermometerSnowflake", "ThermometerSun", "ThumbsDown", "ThumbsUp", "Ticket", "TicketCheck",
  "TicketMinus", "TicketPercent", "TicketPlus", "TicketSlash", "TicketX", "Timer", "ToggleLeft",
  "ToggleRight", "Tornado", "ToyBrick", "Train", "TrainFront", "TrainFrontTunnel", "TrainTrack",
  "Tram", "Transfer", "Trash", "Trash2", "TreeDeciduous", "TreePine", "Trees", "Trello",
  "TrendingDown", "TrendingUp", "Triangle", "TriangleRight", "Trophy", "Truck", "TruckOff",
  "Tshirt", "Tv", "Tv2", "Twitch", "Twitter", "Type", "Umbrella", "Underline", "Undo",
  "Undo2", "UnfoldHorizontal", "UnfoldVertical", "Ungroup", "Unlink", "Unlink2", "Unlock",
  "Unplug", "Upload", "UploadCloud", "Usb", "User", "UserCheck", "UserCog", "UserMinus",
  "UserPlus", "UserX", "Users", "Utensils", "UtensilsCrossed", "UtilityPole", "Variable",
  "Vegan", "VenetianMask", "Verified", "Vibrate", "Video", "VideoOff", "View", "Voicemail",
  "Volume", "Volume1", "Volume2", "VolumeX", "Vote", "Wallet", "Wallet2", "WalletCards",
  "Wallpaper", "Wand", "Wand2", "Warehouse", "Watch", "Waves", "Webcam", "Webhook", "Weight",
  "Wheat", "WholeWord", "Wifi", "WifiOff", "Wind", "Wine", "WineOff", "Workflow", "Wrench",
  "X", "XCircle", "XOctagon", "XSquare", "Youtube", "Zap", "ZapOff", "ZoomIn", "ZoomOut",
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = useMemo(() => {
    if (!searchTerm) {
      return lucideIconNames;
    }
    return lucideIconNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const CurrentIcon = value ? (LucideIcons as any)[value] : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {CurrentIcon ? (
            <CurrentIcon className="mr-2 h-4 w-4" />
          ) : (
            <span className="mr-2 h-4 w-4" />
          )}
          {value || "Selecionar Ícone"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar ícone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
          // Adicione um ícone de busca ao input se o componente Input suportar
          // icon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
        <ScrollArea className="flex-grow pr-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as any)[iconName];
              if (!IconComponent) return null; // Fallback for missing icons

              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? "default" : "outline"}
                  className="flex flex-col h-24 w-24 items-center justify-center text-center p-2"
                  onClick={() => handleSelectIcon(iconName)}
                >
                  <IconComponent className="h-8 w-8 mb-1" />
                  <span className="text-xs truncate w-full">{iconName}</span>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
