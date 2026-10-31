import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/svg

pub type Icon {
  Home
  Folder
  File
  Settings
  Search
  Menu
  Close
  Check
  Plus
  Minus
  ChevronLeft
  ChevronRight
  ChevronUp
  ChevronDown
  First
  Last
  Sort
  SortAscending
  SortDescending
  Calendar
  Clock
  Palette
  User
  Bell
  Eye
  EyeOff
  Copy
  Download
  Upload
  Edit
  Trash
  Link
  Code
  Sun
  Moon
  Monitor
  Heart
  Star
  Smile
  Sparkles
  Info
  Warning
  ArrowLeft
  ArrowRight
  ArrowUp
  ArrowDown
  ArrowUpRight
  Refresh
  Undo
  Redo
  Filter
  MoreHorizontal
  MoreVertical
  Save
  Share
  Print
  Pin
  Maximize
  Minimize
  Grip
  CheckCircle
  XCircle
  Help
  Bookmark
  Tag
  FolderOpen
  FileText
  FileCode
  FileImage
  FilePlus
  Archive
  Clipboard
  Attachment
  Image
  Camera
  Play
  Pause
  Stop
  Volume
  Users
  UserPlus
  Mail
  MessageCircle
  Send
  Globe
  MapPin
  Phone
  Lock
  Unlock
  Key
  Shield
  Terminal
  Database
  Server
  Cloud
  Wifi
  GitBranch
  GitCommit
  GitPullRequest
  GitMerge
  GitHub
  Package
  Layers
  Grid
  List
  Table
  ChartBar
  ChartLine
  ChartPie
  Layout
  BookOpen
  Rocket
  Zap
  Leaf
  Bold
  Italic
  Underline
  Strikethrough
  Paragraph
  Heading
  BulletList
  NumberedList
  Quote
  TableInsert
  RowAdd
  ColumnAdd
  TableDelete
  AlignLeft
}

/// Decorative by default. Give the surrounding control an accessible name.
pub fn view(icon: Icon, attrs: List(Attribute(msg))) -> Element(msg) {
  view_with(icon, Auto, attrs)
}

pub type Style {
  Auto
  Outline
  Soft
  Duotone
}

/// Auto follows the root's component style. Brand marks keep their official shape.
pub fn view_with(
  icon: Icon,
  style: Style,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  svg.svg(
    [
      a.class("meridian-icon"),
      case icon {
        GitHub -> a.data("icon-brand", "github")
        _ -> a.none()
      },
      a.data("icon-style", case style {
        Auto -> "auto"
        Outline -> "outline"
        Soft -> "soft"
        Duotone -> "duotone"
      }),
      a.aria_hidden(True),
      a.attribute("focusable", "false"),
      a.attribute("viewBox", case icon {
        GitHub -> "0 0 32 32"
        _ -> "0 0 24 24"
      }),
      a.attribute("fill", case icon {
        GitHub -> "currentColor"
        _ -> "none"
      }),
      a.attribute("stroke", case icon {
        GitHub -> "none"
        _ -> "currentColor"
      }),
      a.attribute("stroke-width", "2"),
      a.attribute("stroke-linecap", "round"),
      a.attribute("stroke-linejoin", "round"),
      ..attrs
    ],
    [svg.path([a.attribute("d", definition(icon).1)])],
  )
}

pub fn name(icon: Icon) -> String {
  definition(icon).0
}

pub fn all() -> List(Icon) {
  [
    Home, Folder, File, Settings, Search, Menu, Close, Check, Plus, Minus,
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown, First, Last, Sort,
    SortAscending, SortDescending, Calendar, Clock, Palette, User, Bell, Eye,
    EyeOff, Copy, Download, Upload, Edit, Trash, Link, Code, Sun, Moon, Monitor,
    Heart, Star, Smile, Sparkles, Info, Warning, ArrowLeft, ArrowRight, ArrowUp,
    ArrowDown, ArrowUpRight, Refresh, Undo, Redo, Filter, MoreHorizontal,
    MoreVertical, Save, Share, Print, Pin, Maximize, Minimize, Grip, CheckCircle,
    XCircle, Help, Bookmark, Tag, FolderOpen, FileText, FileCode, FileImage,
    FilePlus, Archive, Clipboard, Attachment, Image, Camera, Play, Pause, Stop,
    Volume, Users, UserPlus, Mail, MessageCircle, Send, Globe, MapPin, Phone,
    Lock, Unlock, Key, Shield, Terminal, Database, Server, Cloud, Wifi,
    GitBranch, GitCommit, GitPullRequest, GitMerge, GitHub, Package, Layers,
    Grid, List, Table, ChartBar, ChartLine, ChartPie, Layout, BookOpen, Rocket,
    Zap, Leaf, Bold, Italic, Underline, Strikethrough, Paragraph, Heading,
    BulletList, NumberedList, Quote, TableInsert, RowAdd, ColumnAdd, TableDelete,
    AlignLeft,
  ]
}

fn definition(icon: Icon) -> #(String, String) {
  case icon {
    Home -> #(
      "Home",
      "m3 10 8-6q1-1 2 0l8 6m-17 0v9q0 2 2 2h12q2 0 2-2v-9M9 21v-6q0-1 1-1h4q1 0 1 1v6",
    )
    Folder -> #(
      "Folder",
      "M3 8V6q0-2 2-2h5l2 3h7q2 0 2 2v10q0 2-2 2H5q-2 0-2-2V8Zm0 1h18",
    )
    File -> #(
      "File",
      "M7 2h7l5 5v13q0 2-2 2H7q-2 0-2-2V4q0-2 2-2Zm7 0v5q0 1 1 1h4M8 12h8m-8 4h8",
    )
    Settings -> #(
      "Settings",
      "m10 3-1 3-3 1-3-1-1 4 3 2v3l-2 2 3 3 3-1 3 1 1-3 3-1 3 1 1-4-3-2V9l2-2-3-3-3 1ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    )
    Search -> #("Search", "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 6 6")
    Menu -> #("Menu", "M4 6h16M4 12h16M4 18h16")
    Close -> #("Close", "m6 6 12 12M18 6 6 18")
    Check -> #("Check", "m4 12 5 5L20 6")
    Plus -> #("Plus", "M12 4v16M4 12h16")
    Minus -> #("Minus", "M4 12h16")
    ChevronLeft -> #("Chevron left", "m15 5-7 7 7 7")
    ChevronRight -> #("Chevron right", "m9 5 7 7-7 7")
    ChevronUp -> #("Chevron up", "m5 15 7-7 7 7")
    ChevronDown -> #("Chevron down", "m5 9 7 7 7-7")
    First -> #("First", "m11 5-7 7 7 7m8-14-7 7 7 7")
    Last -> #("Last", "m5 5 7 7-7 7m8-14 7 7-7 7")
    Sort -> #("Sort", "M8 20V4m-4 4 4-4 4 4m4-4v16m-4-4 4 4 4-4")
    SortAscending -> #(
      "Sort ascending",
      "M7 20V4m-4 4 4-4 4 4m3 0h7m-7 5h5m-5 5h3",
    )
    SortDescending -> #(
      "Sort descending",
      "M7 4v16m-4-4 4 4 4-4m3-10h3m-3 5h5m-5 5h7",
    )
    Calendar -> #(
      "Calendar",
      "M4 5h16v16H4Zm0 5h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 4h2",
    )
    Clock -> #("Clock", "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 3")
    Palette -> #(
      "Palette",
      "M21 10c0-5-5-8-10-7S2 8 3 14s6 8 9 7c2-1-1-4 1-5s8 1 8-6ZM7 9h.01M11 6h.01m5 1h.01M6 14h.01",
    )
    User -> #(
      "User",
      "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 6 0 0 1 16 0v3",
    )
    Bell -> #("Bell", "M5 16V9a7 7 0 0 1 14 0v7l2 2H3Zm5 5h4")
    Eye -> #(
      "Eye",
      "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    )
    EyeOff -> #(
      "Eye off",
      "m3 3 18 18M7 6c-3 2-5 6-5 6s4 7 10 7c2 0 4-1 5-2M10 5h2c6 0 10 7 10 7l-2 3M9 9a4 4 0 0 0 6 6",
    )
    Copy -> #(
      "Copy",
      "M10 8h9q2 0 2 2v9q0 2-2 2h-9q-2 0-2-2v-9q0-2 2-2ZM4 16q-1 0-1-2V5q0-2 2-2h9q2 0 2 1",
    )
    Download -> #("Download", "M12 3v12m-5-5 5 5 5-5M3 17v4h18v-4")
    Upload -> #("Upload", "M12 15V3m-5 5 5-5 5 5M3 17v4h18v-4")
    Edit -> #("Edit", "m15 4 5 5M3 21l1-6L17 2l5 5L9 20Zm1-6 5 5")
    Trash -> #("Trash", "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7")
    Link -> #(
      "Link",
      "m9 15 6-6M8 12l-4 4a3 3 0 0 0 4 4l4-4m0-8 4-4a3 3 0 0 1 4 4l-4 4",
    )
    Code -> #("Code", "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18")
    Sun -> #(
      "Sun",
      "M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
    )
    Moon -> #("Moon", "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z")
    Monitor -> #(
      "Monitor",
      "M4 3h16q2 0 2 2v10q0 2-2 2H4q-2 0-2-2V5q0-2 2-2Zm8 14v4m-5 0h10",
    )
    Heart -> #("Heart", "M12 21 3 12C-2 5 7-1 12 6c5-7 14-1 9 6Z")
    Star -> #("Star", "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z")
    Smile -> #(
      "Smile",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M8 9v1m8-1v1m-9 4c2 5 8 5 10 0",
    )
    Sparkles -> #(
      "Sparkles",
      "m9 2 2 7 7 2-7 2-2 7-2-7-5-2 5-2Zm10 11 1 4 3 1-3 1-1 4-1-4-3-1 3-1Z",
    )
    Info -> #(
      "Info",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 11v6m0-10h.01",
    )
    Warning -> #("Warning", "M12 2 1 21h22ZM12 9v5m0 3h.01")
    ArrowLeft -> #("Arrow left", "M20 12H4m7-7-7 7 7 7")
    ArrowRight -> #("Arrow right", "M4 12h16m-7-7 7 7-7 7")
    ArrowUp -> #("Arrow up", "M12 20V4m-7 7 7-7 7 7")
    ArrowDown -> #("Arrow down", "M12 4v16m-7-7 7 7 7-7")
    ArrowUpRight -> #("Arrow up right", "M5 19 19 5M7 5h12v12")
    Refresh -> #("Refresh", "M21 8a9 9 0 1 0 0 8M21 3v5h-5")
    Undo -> #("Undo", "M3 8h11a6.5 6.5 0 0 1 0 13M3 8l5-5M3 8l5 5")
    Redo -> #("Redo", "M21 8H10a6.5 6.5 0 0 0 0 13M21 8l-5-5m5 5-5 5")
    Filter -> #("Filter", "M4 4h16q1 0 .4 1L14 13v6l-4 2v-8L3.6 5Q3 4 4 4Z")
    MoreHorizontal -> #("More horizontal", "M4 12h.01M12 12h.01M20 12h.01")
    MoreVertical -> #("More vertical", "M12 4h.01M12 12h.01M12 20h.01")
    Save -> #(
      "Save",
      "M5 3h12l4 4v12q0 2-2 2H5q-2 0-2-2V5q0-2 2-2Zm2 0v6h9V3M7 21v-7h10v7",
    )
    Share -> #(
      "Share",
      "M7 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0m10-7a3 3 0 1 1 6 0 3 3 0 0 1-6 0m0 14a3 3 0 1 1 6 0 3 3 0 0 1-6 0M7 10l10-4M7 14l10 4",
    )
    Print -> #(
      "Print",
      "M7 8V3h10v5M7 17H4q-2 0-2-2v-5q0-2 2-2h16q2 0 2 2v5q0 2-2 2h-3M7 14h10v7H7Zm11-3h.01",
    )
    Pin -> #("Pin", "M8 3h8m-7 0v6l-3 4v2h12v-2l-3-4V3M12 15v7")
    Maximize -> #(
      "Maximize",
      "M3 9V5q0-2 2-2h4m6 0h4q2 0 2 2v4m0 6v4q0 2-2 2h-4m-6 0H5q-2 0-2-2v-4",
    )
    Minimize -> #(
      "Minimize",
      "M3 9h4q2 0 2-2V3m6 0v4q0 2 2 2h4m0 6h-4q-2 0-2 2v4m-6 0v-4q0-2-2-2H3",
    )
    Grip -> #("Grip", "M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01")
    CheckCircle -> #(
      "Check circle",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M7 12l3 3 7-7",
    )
    XCircle -> #(
      "Close circle",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0m-14-4 8 8m0-8-8 8",
    )
    Help -> #(
      "Help",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01",
    )
    Bookmark -> #("Bookmark", "M7 3h10q2 0 2 2v16l-7-4-7 4V5q0-2 2-2Z")
    Tag -> #("Tag", "M3 4v7l10 10 9-9L12 2H5q-2 0-2 2Zm4 2h.01")
    FolderOpen -> #(
      "Folder open",
      "M3 10V6q0-2 2-2h5l2 3h7q2 0 2 2v2M3 11h18l-3 10H4L2 11Z",
    )
    FileText -> #(
      "File text",
      "M7 2h7l5 5v13q0 2-2 2H7q-2 0-2-2V4q0-2 2-2Zm7 0v6h5M8 12h8m-8 4h8",
    )
    FileCode -> #(
      "File code",
      "M7 2h7l5 5v13q0 2-2 2H7q-2 0-2-2V4q0-2 2-2Zm7 0v6h5m-9 4-3 3 3 3m4-6 3 3-3 3",
    )
    FileImage -> #(
      "File image",
      "M7 2h7l5 5v13q0 2-2 2H7q-2 0-2-2V4q0-2 2-2Zm7 0v6h5M7 19l4-5 3 3 2-2 3 4M9 10h.01",
    )
    FilePlus -> #(
      "File plus",
      "M7 2h7l5 5v13q0 2-2 2H7q-2 0-2-2V4q0-2 2-2Zm7 0v6h5M12 11v7m-3-3.5h6",
    )
    Archive -> #("Archive", "M4 3h16v5H4Zm1 5v11q0 2 2 2h10q2 0 2-2V8M9 12h6")
    Clipboard -> #(
      "Clipboard",
      "M9 4H6q-2 0-2 2v14q0 2 2 2h12q2 0 2-2V6q0-2-2-2h-3M9 2h6v5H9Z",
    )
    Attachment -> #(
      "Attachment",
      "m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2m-5 11a1 1 0 0 0 2 2l7-7",
    )
    Image -> #(
      "Image",
      "M5 3h14q2 0 2 2v14q0 2-2 2H5q-2 0-2-2V5q0-2 2-2Zm-2 14 6-7 5 6 3-3 4 4M16 7h.01",
    )
    Camera -> #(
      "Camera",
      "M5 6h3l2-3h4l2 3h3q2 0 2 2v11q0 2-2 2H5q-2 0-2-2V8q0-2 2-2Zm11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    )
    Play -> #("Play", "M7 4q-2-1-2 1v14q0 2 2 1l13-7q2-1 0-2Z")
    Pause -> #("Pause", "M5 4h4v16H5Zm10 0h4v16h-4Z")
    Stop -> #("Stop", "M6 4h12q2 0 2 2v12q0 2-2 2H6q-2 0-2-2V6q0-2 2-2Z")
    Volume -> #(
      "Volume",
      "M3 9h4l6-5v16l-6-5H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
    )
    Users -> #(
      "Users",
      "M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M2 21v-3q0-5 8-5t8 5v3m-1-17a4 4 0 0 1 0 7m3 3q3 1 3 5v2",
    )
    UserPlus -> #(
      "User plus",
      "M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M2 21v-3q0-5 7-5t7 5v3m3-17v8m-4-4h8",
    )
    Mail -> #(
      "Mail",
      "M5 4h14q3 0 3 3v10q0 3-3 3H5q-3 0-3-3V7q0-3 3-3Zm-2 2 9 7 9-7",
    )
    MessageCircle -> #(
      "Message circle",
      "M22 11a10 9 0 0 1-10 9H5l-4 3 2-7a10 9 0 1 1 19-5ZM7 10h.01M12 10h.01M17 10h.01",
    )
    Send -> #("Send", "m3 3 19 9-19 9 3-9Zm3 9h16")
    Globe -> #(
      "Globe",
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20Z",
    )
    MapPin -> #(
      "Map pin",
      "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    )
    Phone -> #(
      "Phone",
      "M7 3H4q-2 0-2 2c0 9 8 17 17 17q2 0 2-2v-3l-5-2-2 3q-6-2-8-8l3-2Z",
    )
    Lock -> #(
      "Lock",
      "M7 10V7a5 5 0 0 1 10 0v3M6 10h12q2 0 2 2v8q0 2-2 2H6q-2 0-2-2v-8q0-2 2-2Zm6 4v4",
    )
    Unlock -> #(
      "Unlock",
      "M7 10V7a5 5 0 0 1 9-3M6 10h12q2 0 2 2v8q0 2-2 2H6q-2 0-2-2v-8q0-2 2-2Zm6 4v4",
    )
    Key -> #("Key", "M14 7a6 6 0 1 1-5 6L2 20v2h4v-3h3v-3l3-3m5-7h.01")
    Shield -> #("Shield", "M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6Z")
    Terminal -> #(
      "Terminal",
      "M5 3h14q3 0 3 3v12q0 3-3 3H5q-3 0-3-3V6q0-3 3-3Zm1 5 4 4-4 4m7 0h5",
    )
    Database -> #(
      "Database",
      "M21 6a9 4 0 1 1-18 0 9 4 0 0 1 18 0ZM3 6v12a9 4 0 0 0 18 0V6M3 12a9 4 0 0 0 18 0",
    )
    Server -> #(
      "Server",
      "M5 3h14q2 0 2 2v4q0 2-2 2H5q-2 0-2-2V5q0-2 2-2Zm0 10h14q2 0 2 2v4q0 2-2 2H5q-2 0-2-2v-4q0-2 2-2ZM7 7h.01M7 17h.01m8-10h3m-3 10h3",
    )
    Cloud -> #(
      "Cloud",
      "M7 19C.5 19 .5 9 6.5 9 7.5 1 18 2 19 9c5.5 0 5.5 10-1 10Z",
    )
    Wifi -> #(
      "Wifi",
      "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01",
    )
    GitBranch -> #(
      "Git branch",
      "M8 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m0 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 8v8m14-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 0q0 11-11 11",
    )
    GitCommit -> #(
      "Git commit",
      "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M2 12h6m8 0h6",
    )
    GitPullRequest -> #(
      "Git pull request",
      "M8 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m0 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 8v8m17 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-3-3V8q0-3-5-3h-2m3-3-3 3 3 3",
    )
    GitMerge -> #(
      "Git merge",
      "M8 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m0 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 8v8m0-8q0 9 11 9m6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    )
    // Official GitHub mark, also used by the catalogue header.
    GitHub -> #(
      "GitHub",
      "M16 0C7.16 0 0 7.16 0 16C0 23.08 4.58 29.06 10.94 31.18C11.74 31.32 12.04 30.84 12.04 30.42C12.04 30.04 12.02 28.78 12.02 27.44C8 28.18 6.96 26.46 6.64 25.56C6.46 25.1 5.68 23.68 5 23.3C4.44 23 3.64 22.26 4.98 22.24C6.24 22.22 7.14 23.4 7.44 23.88C8.88 26.3 11.18 25.62 12.1 25.2C12.24 24.16 12.66 23.46 13.12 23.06C9.56 22.66 5.84 21.28 5.84 15.16C5.84 13.42 6.46 11.98 7.48 10.86C7.32 10.46 6.76 8.82 7.64 6.62C7.64 6.62 8.98 6.2 12.04 8.26C13.32 7.9 14.68 7.72 16.04 7.72C17.4 7.72 18.76 7.9 20.04 8.26C23.1 6.18 24.44 6.62 24.44 6.62C25.32 8.82 24.76 10.46 24.6 10.86C25.62 11.98 26.24 13.4 26.24 15.16C26.24 21.3 22.5 22.66 18.94 23.06C19.52 23.56 20.02 24.52 20.02 26.02C20.02 28.16 20 29.88 20 30.42C20 30.84 20.3 31.34 21.1 31.18C27.42 29.06 32 23.06 32 16C32 7.16 24.84 0 16 0Z",
    )
    Package -> #(
      "Package",
      "m12 2 10 5v10l-10 5-10-5V7Zm0 10v10M2 7l10 5 10-5M7 4.5l10 5",
    )
    Layers -> #(
      "Layers",
      "m12 2 10 6-10 6L2 8Zm-10 10 10 6 10-6M2 16l10 6 10-6",
    )
    Grid -> #("Grid", "M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z")
    List -> #("List", "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01")
    Table -> #(
      "Table",
      "M5 3h14q2 0 2 2v14q0 2-2 2H5q-2 0-2-2V5q0-2 2-2Zm-2 6h18M9 9v12m6-12v12",
    )
    ChartBar -> #("Bar chart", "M3 3v16q0 2 2 2h16M7 17v-6m5 6V6m5 11V9")
    ChartLine -> #("Line chart", "M3 3v16q0 2 2 2h16M7 15l4-6 5 3 5-7")
    ChartPie -> #(
      "Pie chart",
      "M10 3a9 9 0 1 0 11 11H10Zm4-1v8h8a8 8 0 0 0-8-8Z",
    )
    Layout -> #(
      "Layout",
      "M5 3h14q2 0 2 2v14q0 2-2 2H5q-2 0-2-2V5q0-2 2-2Zm-2 5h18M9 8v13",
    )
    BookOpen -> #(
      "Book open",
      "M12 5q-5-4-10-1v16q5-3 10 1 5-4 10-1V4q-5-3-10 1Zm0 0v16",
    )
    Rocket -> #(
      "Rocket",
      "M9 15c-1-6 4-12 12-13 1 8-5 13-11 13Zm0-6H5l-3 5 7 1m6 0v4l-5 3-1-7m7-8h.01M6 18l-3 3",
    )
    Zap -> #("Zap", "M13 2 3 14h8l-1 8L21 9h-8Z")
    Leaf -> #("Leaf", "M21 3C3 1-2 15 7 20s15-5 14-17ZM4 21 16 9")
    Bold -> #("Bold", "M6 3h7a5 5 0 0 1 0 10H6Zm0 10h8a4 4 0 0 1 0 8H6Z")
    Italic -> #("Italic", "M10 3h10M4 21h10M15 3 9 21")
    Underline -> #("Underline", "M6 3v8a6 6 0 0 0 12 0V3M4 21h16")
    Strikethrough -> #(
      "Strikethrough",
      "M18 6q-1-3-6-3-7 0-6 5 0 2 6 4M4 12h16m-8 0q6 1 6 5 0 4-6 4-5 0-6-3",
    )
    Paragraph -> #(
      "Paragraph",
      "M13 3H9a5 5 0 0 0 0 10h4Zm0 0v18m5-18v18M13 3h8",
    )
    Heading -> #("Heading", "M5 4v16M19 4v16M5 12h14")
    BulletList -> #(
      "Bullet list",
      "M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01",
    )
    NumberedList -> #(
      "Numbered list",
      "M10 5h11M10 12h11M10 19h11M3 3h1v5m-1 0h2m-3 5c3-3 5 0 1 3h3m-4 3h2l-1 2h2",
    )
    Quote -> #("Quote", "M3 12h6v7H3Zm12 0h6v7h-6ZM3 12q0-6 6-8m6 8q0-6 6-8")
    TableInsert -> #(
      "Insert table",
      "M4 3h13q2 0 2 2v6M2 8h17M8 8v13M2 8v11q0 2 2 2h7M15 17h8m-4-4v8",
    )
    RowAdd -> #(
      "Add row",
      "M5 3h14q2 0 2 2v7H3V5q0-2 2-2Zm-2 5h18M12 16v7m-4-3.5h8",
    )
    ColumnAdd -> #(
      "Add column",
      "M5 3h7v18H5q-2 0-2-2V5q0-2 2-2Zm3 0v18m8-9h7m-3.5-4v8",
    )
    TableDelete -> #(
      "Delete table",
      "M4 3h13q2 0 2 2v6M2 8h17M8 8v13M2 8v11q0 2 2 2h7m4-6 7 7m0-7-7 7",
    )
    AlignLeft -> #("Align left", "M3 4h18M3 9h12M3 14h18M3 19h12")
  }
}

pub fn category(icon: Icon) -> String {
  case icon {
    GitHub -> "brands"
    Bold
    | Italic
    | Underline
    | Strikethrough
    | Paragraph
    | Heading
    | BulletList
    | NumberedList
    | Quote
    | TableInsert
    | RowAdd
    | ColumnAdd
    | TableDelete
    | AlignLeft -> "editor"
    File
    | Folder
    | FolderOpen
    | FileText
    | FileCode
    | FileImage
    | FilePlus
    | Archive
    | Clipboard
    | Attachment -> "files"
    Image | Camera | Play | Pause | Stop | Volume | Palette -> "media"
    User | Users | UserPlus | Smile -> "people"
    Mail | MessageCircle | Send | Phone | Bell | Share -> "communication"
    Lock | Unlock | Key | Shield | Eye | EyeOff -> "security"
    Terminal
    | Database
    | Server
    | Cloud
    | Wifi
    | GitBranch
    | GitCommit
    | GitPullRequest
    | GitMerge
    | Code
    | Package -> "development"
    Table
    | ChartBar
    | ChartLine
    | ChartPie
    | Grid
    | List
    | Layers
    | Layout
    | Sort
    | SortAscending
    | SortDescending -> "data"
    Heart | Star | Sparkles | Sun | Moon | Rocket | Zap | Leaf -> "nature"
    Home
    | Menu
    | ChevronLeft
    | ChevronRight
    | ChevronUp
    | ChevronDown
    | First
    | Last
    | ArrowLeft
    | ArrowRight
    | ArrowUp
    | ArrowDown
    | ArrowUpRight
    | Globe
    | MapPin
    | BookOpen -> "navigation"
    _ -> "actions"
  }
}
