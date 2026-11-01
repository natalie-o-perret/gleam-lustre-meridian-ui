const text = (name, label, value, alternate) => ({
  name,
  label,
  type: "text",
  value,
  alternate,
});
const flag = (name, label, value = false) => ({
  name,
  label,
  type: "boolean",
  value: String(value),
  alternate: String(!value),
});
const number = (name, label, value, min, max, alternate, step = 1) => ({
  name,
  label,
  type: "number",
  value: String(value),
  min,
  max,
  step,
  alternate: String(alternate),
});
const choice = (name, label, value, options) => ({
  name,
  label,
  type: "choice",
  value,
  options,
  alternate: options.find((option) => option !== value),
});
const label = (value) => text("label", "Label", value, "A custom label");
const disabled = () => flag("disabled", "Disabled");
const required = () => flag("required", "Required");
const orientation = () => flag("vertical", "Vertical layout");
const textConstraints = [
  flag("readonly", "Read-only"),
  number("minlength", "Minimum length", 0, 0, 100, 3),
  number("maxlength", "Maximum length", 200, 1, 1000, 20),
];
const menuItems = [
  flag("nested", "Nested export actions", true),
  flag("locked", "Disable delete action", true),
  flag("separators", "Group separator", true),
];
const stages = [
  flag("lockBuild", "Lock Build stage"),
  flag("descriptions", "Stage descriptions"),
];
const teams = [
  flag("children", "Show child teams", true),
  flag("lockTeam", "Disable Engineering"),
];
const treeAppearance = [
  flag("lines", "Dashed tree lines", true),
  flag("boxed", "Boxed +/- toggles", true),
  flag("animate", "Expand/collapse animation", true),
];
const zone = () =>
  choice("zone", "Time zone", "disabled", [
    "disabled",
    "browser",
    "UTC",
    "Europe/Dublin",
    "America/New_York",
    "Asia/Tokyo",
  ]);

const definitions = {
  formvalidation: [
    text("email", "Email value", "", "person@example.com"),
    number("minimum", "Minimum password length", 10, 8, 64, 16),
    flag("required", "Email required", true),
    disabled(),
  ],
  treeselect: [
    label("Choose teams"),
    flag("multiple", "Multiple selection", true),
    flag("empty", "Empty tree"),
    flag("expanded", "Expanded groups"),
    ...teams,
    ...treeAppearance,
  ],
  autocomplete: [
    label("Choose a language"),
    text("value", "Value", "", "Gleam"),
    disabled(),
    number("suggestions", "Suggestion count", 20, 0, 20, 3),
    ...textConstraints,
  ],
  cascadeselect: [
    label("Team"),
    disabled(),
    required(),
    choice("path", "Selected team", "none", ["none", "tokens", "api"]),
  ],
  checkbox: [
    label("Send project updates"),
    flag("checked", "Checked"),
    disabled(),
    required(),
  ],
  datepicker: [
    label("Single date"),
    text("value", "Value", "2026-11-05", "2026-12-24"),
    flag("required", "Required", true),
    text("min", "Earliest date", "2026-01-01", "2026-11-01"),
    text("max", "Latest date", "2027-12-31", "2026-11-30"),
    flag("readonly", "Read-only"),
    disabled(),
  ],
  datetimepicker: [
    label("Meeting date and time"),
    text("value", "Value", "2026-11-05T09:30:15", "2026-11-24T16:45:30"),
    flag("required", "Required", true),
    text("min", "Minimum", "2026-11-01T09:00", "2026-10-01T00:00"),
    text("max", "Maximum", "2026-11-30T17:00", "2026-12-31T23:59:59"),
    choice("step", "Step (seconds)", "1", ["1", "60", "0.5", "0.001", "any"]),
    zone(),
    flag("readonly", "Read-only"),
    disabled(),
  ],
  timepicker: [
    label("Meeting time (09:00-17:00)"),
    text("value", "Value", "09:30:15", "16:45:30"),
    disabled(),
    text("min", "Minimum", "09:00", "00:00"),
    text("max", "Maximum", "17:00", "23:59:59"),
    choice("step", "Step (seconds)", "1", ["1", "60", "0.5", "0.001", "any"]),
    zone(),
    flag("readonly", "Read-only"),
  ],
  floatlabel: [
    label("Project name"),
    text("value", "Value", "", "Meridian"),
    disabled(),
    ...textConstraints,
  ],
  iconfield: [
    text("placeholder", "Placeholder", "", "Search your team"),
    disabled(),
    choice("icon", "Field icon", "search", ["search", "mail", "user"]),
  ],
  iftalabel: [
    label("Project reference"),
    text("value", "Value", "", "Meridian"),
    disabled(),
    ...textConstraints,
  ],
  inputcolor: [
    label("Accent colour"),
    text("value", "Colour", "#b41472", "#316a91"),
    disabled(),
  ],
  inputgroup: [
    text("placeholder", "Placeholder", "", "Your website"),
    disabled(),
    text("prefix", "Prefix content", "https://", "www."),
    text("suffix", "Suffix content", ".example", ".org"),
  ],
  inputmask: [
    label("Telephone"),
    text("mask", "Mask", "000 000 0000", "0000-0000"),
    disabled(),
  ],
  inputnumber: [
    label("Seats (1-50)"),
    text("value", "Value", "", "12"),
    disabled(),
    required(),
    number("min", "Minimum", 1, -100, 100, 0),
    number("max", "Maximum", 50, 1, 1000, 100),
    choice("step", "Step", "1", ["1", "2", "5", "0.5", "any"]),
    flag("readonly", "Read-only"),
  ],
  inputotp: [
    number("digits", "Digits", 6, 2, 12, 4),
    choice("alphabet", "Alphabet", "digits", ["digits", "alphanumeric"]),
    required(),
    disabled(),
    flag("readonly", "Read-only"),
  ],
  inputpassword: [
    label("Account password"),
    flag("revealed", "Revealed"),
    disabled(),
    ...textConstraints,
  ],
  inputtags: [
    label("Project labels"),
    required(),
    disabled(),
    text("tags", "Tags (comma-separated)", "Gleam,Lustre", "Design,Review"),
  ],
  inputtext: [
    label("Your name"),
    text("value", "Value", "", "Meridian"),
    disabled(),
    required(),
    ...textConstraints,
  ],
  keyfilter: [
    text("pattern", "Pattern", "[\\p{L}\\p{M} ]*", "[0-9]+"),
    text("hint", "Help text", "Letters and spaces only.", "Digits only."),
  ],
  knob: [
    number("value", "Value", 40, 0, 100, 70),
    number("min", "Minimum", 0, 0, 30, 10),
    number("max", "Maximum", 100, 70, 100, 80),
    choice("step", "Step", "5", ["1", "5", "10"]),
    disabled(),
  ],
  label: [
    label("Click this label to focus its input"),
    text("value", "Value", "", "A labelled field"),
  ],
  listbox: [
    number("rows", "Visible rows", 4, 2, 10, 6),
    flag("multiple", "Multiple selection", true),
    disabled(),
  ],
  radiobutton: [label("Design"), disabled(), required()],
  rating: [
    number("minimum", "Minimum", 1, 0, 99, 0, 0.1),
    number("maximum", "Maximum", 5, 1, 100, 10, 0.1),
    choice("step", "Step", "1", ["1", "0.5", "0.25", "0.1"]),
    number("value", "Rating", 3, 0, 100, 1.5, 0.1),
    required(),
    disabled(),
  ],
  select: [
    label("Team"),
    choice("content", "Item content", "tags", ["tags", "plain"]),
    text("query", "Search", "", "Engineering"),
    disabled(),
  ],
  selectbutton: [
    flag("multiple", "Multiple selection", true),
    required(),
    disabled(),
  ],
  slider: [
    label("Budget range"),
    number("minimum", "Lower bound", 0, 0, 30, 10),
    number("maximum", "Upper bound", 100, 70, 100, 90),
    number("lower", "Minimum value", 20, 0, 100, 40),
    number("upper", "Maximum value", 80, 0, 100, 95),
    disabled(),
  ],
  textarea: [
    label("Project notes"),
    text("value", "Value", "", "A longer note about your next project."),
    required(),
    disabled(),
    number("rows", "Visible rows", 4, 2, 12, 8),
    ...textConstraints,
  ],
  togglebutton: [label("Pin project"), flag("checked", "Pressed"), disabled()],
  toggleswitch: [
    label("Email notifications"),
    flag("checked", "Checked"),
    disabled(),
  ],
  button: [
    text("label", "Primary label", "Create project", "Save changes"),
    choice("variant", "Primary variant", "primary", [
      "primary",
      "plain",
      "text",
      "icon",
    ]),
    choice("icon", "Button icon", "none", [
      "none",
      "check",
      "add",
      "download",
      "arrow",
    ]),
    choice("iconPosition", "Icon position", "leading", ["leading", "trailing"]),
    disabled(),
  ],
  speeddial: [
    label("Quick actions"),
    flag("open", "Open"),
    flag("empty", "Empty actions"),
    ...menuItems,
  ],
  splitbutton: [
    label("Save project"),
    flag("empty", "Empty actions"),
    ...menuItems,
  ],
  dataview: [
    flag("grid", "Grid layout", true),
    number("size", "Page size", 4, 1, 8, 2),
    text("query", "Project filter", "", "a"),
    flag("details", "Project descriptions", true),
  ],
  orderlist: [label("Project stages"), flag("empty", "Empty list"), ...stages],
  organizationchart: [
    label("Organisation"),
    flag("empty", "Empty chart"),
    flag("children", "Show child teams", true),
    choice("content", "Node content", "plain", ["plain", "tags"]),
  ],
  paginator: [
    number("total", "Total records", 8, 0, 10000, 50),
    choice("size", "Page size", "3", ["3", "5", "10", "25", "50"]),
    text("sizes", "Page-size choices", "3,5,10,25,50", "2,4,8"),
    number("page", "Page (zero-based)", 0, 0, 100, 1),
  ],
  picklist: [
    label("Available stages"),
    text("targetLabel", "Target label", "Selected stages", "Release plan"),
    flag("empty", "Empty source"),
    ...stages,
  ],
  table: [
    choice("mode", "Data source", "client", ["client", "server"]),
    label("Projects"),
    text("query", "Filter", "", "a"),
    number("size", "Page size", 3, 1, 8, 1),
    flag("empty", "Empty results"),
    flag("fail", "Simulate server failure"),
    number("latency", "Server delay (ms)", 400, 0, 2000, 800),
  ],
  timeline: [
    flag("vertical", "Vertical layout", true),
    choice("alignment", "Alignment", "start", ["start", "end", "alternate"]),
    flag("opposite", "Opposite date content", true),
    choice("marker", "Markers", "dot", ["dot", "icon"]),
    flag("cards", "Event cards"),
    flag("reverse", "Newest first"),
    flag("empty", "Empty timeline"),
  ],
  tree: [
    label("Workspace teams"),
    flag("multiple", "Multiple selection", true),
    flag("empty", "Empty tree"),
    flag("expanded", "Expanded groups"),
    choice("content", "Node content", "plain", ["plain", "tags"]),
    ...teams,
    ...treeAppearance,
  ],
  treetable: [
    label("Workspace hierarchy"),
    flag("empty", "Empty tree"),
    flag("expanded", "Expanded groups"),
    flag("statusColumn", "Status column"),
    ...teams,
    ...treeAppearance,
  ],
  virtualscroller: [
    number("count", "Item count", 1000, 0, 20000, 100),
    number("height", "Row height", 44, 24, 80, 60),
    number("viewport", "Viewport height (px)", 320, 100, 600, 200),
  ],
  accordion: [
    flag("multiple", "Multiple panels", true),
    label("Common questions"),
    choice("panels", "Expanded panels", "about", [
      "about",
      "state",
      "both",
      "none",
    ]),
    flag("stateDisabled", "Disable state panel"),
  ],
  card: [
    text("title", "Heading", "A place for your next idea", "Project settings"),
    text(
      "text",
      "Content",
      "Cards give related content a clear home, without prescribing your layout.",
      "Your own content, in a shared card.",
    ),
    flag("actions", "Action content", true),
  ],
  divider: [text("label", "Divider label", "or", "Continue"), orientation()],
  fieldset: [
    label("Project settings"),
    flag("expanded", "Expanded", true),
    disabled(),
  ],
  panel: [
    label("Project overview"),
    flag("expanded", "Expanded", true),
    flag("actions", "Header action"),
  ],
  scrollarea: [
    number("height", "Height (px)", 192, 80, 600, 120),
    label("Release notes"),
    number(
      "contentWidth",
      "Scrollable content width (0 auto)",
      0,
      0,
      1600,
      900,
    ),
  ],
  splitter: [
    number("percent", "1st pane (%)", 50, 15, 85, 30),
    orientation(),
    number("minimum", "Minimum 1st pane (%)", 15, 0, 40, 25),
    number("maximum", "Maximum 1st pane (%)", 85, 60, 100, 75),
  ],
  stepper: [
    flag("complete", "First step complete"),
    flag("linear", "Linear", true),
    orientation(),
  ],
  tabs: [
    orientation(),
    choice("active", "Active tab", "overview", ["overview", "activity"]),
    choice("activation", "Keyboard activation", "automatic", [
      "automatic",
      "manual",
    ]),
  ],
  toolbar: [
    orientation(),
    label("Document actions"),
    flag("deleteDisabled", "Disable delete action", true),
  ],
  confirmdialog: [
    flag("open", "Open"),
    text("title", "Title", "Archive this project?", "Delete this draft?"),
    text(
      "text",
      "Confirmation content",
      "This demo records your choice without changing any data.",
      "Archiving keeps the project available in your archive.",
    ),
  ],
  confirmpopup: [
    flag("open", "Open"),
    text("title", "Title", "Archive this project?", "Remove this item?"),
    text(
      "text",
      "Confirmation content",
      "Confirm or cancel this action.",
      "Your other items won't change.",
    ),
  ],
  dialog: [
    flag("open", "Open"),
    text("title", "Title", "Edit project", "Edit workspace"),
    flag("modal", "Modal", true),
    flag("readonly", "Read-only field"),
    number("width", "Dialog width (px)", 576, 240, 960, 400),
    text(
      "text",
      "Dialog content",
      "Update the project name, then save your changes.",
      "Names are visible to everyone in your workspace.",
    ),
  ],
  drawer: [
    choice("side", "Side", "right", ["right", "left", "top", "bottom"]),
    flag("open", "Open"),
    text(
      "text",
      "Drawer content",
      "A drawer can open from any logical edge.",
      "Choose a project or switch teams.",
    ),
  ],
  dynamicdialog: [
    flag("open", "Open"),
    text("title", "Title", "Review 1", "Workspace details"),
    text(
      "text",
      "Dialog content",
      "The title and content come from ordinary application state.",
      "Meridian: 3 team members, 2 active projects, ready for review.",
    ),
  ],
  popover: [
    flag("open", "Open"),
    text(
      "text",
      "Content",
      "An anchored native popover. Click outside or press Escape to dismiss it.",
      "Custom popover content.",
    ),
  ],
  tooltip: [
    text(
      "hint",
      "Hint",
      "This hint also appears when the button has keyboard focus.",
      "A custom keyboard and pointer hint.",
    ),
  ],
  breadcrumb: [
    label("Project location"),
    text("labelText", "Current item", "Meridian", "Your project"),
    flag("workspace", "Include workspace link", true),
  ],
  commandmenu: [
    flag("open", "Open"),
    text("query", "Search", "", "export"),
    flag("exportDisabled", "Disable export command"),
  ],
  contextmenu: [
    label("Project actions"),
    flag("empty", "Empty menu"),
    ...menuItems,
  ],
  dock: [
    label("Workspace navigation"),
    flag("empty", "Empty dock"),
    choice("active", "Current destination", "home", [
      "home",
      "projects",
      "settings",
    ]),
  ],
  megamenu: [
    label("Explore workspace"),
    flag("empty", "Empty menu"),
    choice("group", "Visible group", "all", [
      "all",
      "Build",
      "Collaborate",
      "Learn",
    ]),
  ],
  menu: [label("Project actions"), flag("empty", "Empty menu"), ...menuItems],
  menubar: [label("Application"), flag("empty", "Empty menu"), ...menuItems],
  sidebar: [
    flag("expanded", "Expanded", true),
    label("Workspace"),
    text("query", "Link filter", "", "project"),
  ],
  tieredmenu: [
    label("Project actions"),
    flag("empty", "Empty menu"),
    ...menuItems,
  ],
  message: [
    choice("tone", "Primary tone", "success", [
      "success",
      "warning",
      "info",
      "danger",
    ]),
    text(
      "text",
      "Message",
      "Your project is ready.",
      "Your custom status message.",
    ),
  ],
  toast: [
    choice("position", "Position", "inline", [
      "inline",
      "top-left",
      "top-centre",
      "top-right",
      "centre",
      "bottom-left",
      "bottom-centre",
      "bottom-right",
    ]),
    choice("tone", "Tone", "success", ["success", "info", "warning", "danger"]),
    flag("closable", "Dismiss button", true),
    number("timeout", "Timeout (ms, 0 persists)", 4000, 0, 10000, 0),
    text("text", "Notice text", "Project saved.", "Changes published."),
  ],
  carousel: [
    number("slide", "Slide (zero-based)", 0, 0, 2, 1),
    label("Project highlights"),
  ],
  compare: [
    number("value", "Comparison (%)", 50, 0, 100, 75),
    label("Compare colour palettes"),
    flag("draggable", "On-image drag handle", true),
    orientation(),
    text(
      "beforeLabel",
      "Before image label",
      "Original palette",
      "Before editing",
    ),
    text("afterLabel", "After image label", "Updated palette", "After editing"),
  ],
  gallery: [
    number("slide", "Image (zero-based)", 0, 0, 1, 1),
    flag("active", "Preview open"),
  ],
  fileupload: [
    number("maxBytes", "Maximum file size", 1048576, 1, 10485760, 1024),
    text("accept", "Accepted types", ".txt,image/*", "image/*"),
    flag("multiple", "Multiple files", true),
  ],
  filetree: [
    label("Project files"),
    flag("multiple", "Multiple selection"),
    flag("empty", "Empty tree"),
    flag("expanded", "Expanded folders", true),
    flag("lockSecrets", "Disable secrets file", true),
    ...treeAppearance,
  ],
  animateonscroll: [
    choice("animation", "Effect", "slide-up", [
      "slide-up",
      "fade",
      "slide-left",
      "slide-right",
      "zoom",
    ]),
    flag("once", "Reveal once"),
    number("duration", "Duration (ms)", 300, 100, 2000, 700),
    text(
      "text",
      "Content",
      "This content is revealed when it enters the viewport. Reduced motion keeps it still and visible.",
      "A custom reveal panel.",
    ),
  ],
  autofocus: [
    text("placeholder", "Placeholder", "Start typing", "Focus starts here"),
    flag("autofocus", "Autofocus", true),
  ],
  avatar: [
    text("label", "First person's name", "Alex Morgan", "Dee Murphy"),
    text("initials", "First person's initials", "AM", "DM"),
    choice("content", "Avatar content", "initials", [
      "initials",
      "image",
      "icon",
    ]),
    number("size", "1st avatar size (px)", 40, 24, 80, 64),
  ],
  badge: [
    number("count", "Additional notifications", 0, 0, 1000, 100),
    number("maximum", "Counter cap", 99, 1, 999, 9),
  ],
  bind: [text("text", "Value", "", "Your next project")],
  blockui: [
    flag("active", "Blocked"),
    text("label", "Busy label", "Saving changes", "Publishing changes"),
  ],
  chip: [
    text("text", "Chip content", "Gleam", "Lustre"),
    flag("visible", "Removable chip visible", true),
  ],
  classnames: [flag("active", "Highlight")],
  fluid: [
    text("placeholder", "Placeholder", "Full-width input", "Your project name"),
    disabled(),
  ],
  focustrap: [flag("active", "Trap active")],
  inplace: [
    text("text", "Value", "Project Meridian", "Workspace Meridian"),
    flag("active", "Editing"),
  ],
  metergroup: [
    number("value", "Documents stored", 40, 0, 100, 80),
    number("images", "Images stored", 25, 0, 100, 10),
    number("backups", "Backups stored", 15, 0, 100, 30),
    number("maximum", "Capacity", 100, 1, 500, 200),
  ],
  progressbar: [
    number("value", "Progress (%)", 45, 0, 100, 75),
    label("Upload"),
    flag("indeterminate", "Indeterminate"),
  ],
  progressspinner: [
    number("value", "Determinate progress (%)", 65, 0, 100, 25),
    label("Loading projects"),
  ],
  ripple: [label("Pointer and keyboard ripple"), disabled()],
  scrolltop: [number("height", "Scroll area height (px)", 224, 100, 500, 120)],
  skeleton: [
    flag("loaded", "Loaded content"),
    flag("avatar", "Show avatar", true),
    flag("image", "Show cover image", true),
    number("lines", "Text lines", 3, 1, 8, 5),
    number("imageHeight", "Cover height (px)", 128, 80, 300, 200),
    number("width", "Card width (px)", 560, 240, 960, 400),
    flag("animate", "Shimmer", true),
  ],
  styleclass: [flag("active", "Highlight")],
  tag: [
    text("text", "1st tag", "Active", "Published"),
    choice("tone", "First tag tone", "success", [
      "success",
      "warning",
      "danger",
      "accent",
    ]),
  ],
  terminal: [
    text("label", "Label", "Example terminal", "Command console"),
    text("draft", "Command draft", "", "status"),
    text("prompt", "Prompt", "user@meridian:~ $", "❯"),
    number("height", "History height (px)", 200, 80, 600, 320),
    flag("wrap", "Wrap long lines", true),
    flag("readonly", "Read-only"),
  ],
  filterservice: [
    text("query", "Query", "", "a"),
    choice("match", "Text match", "contains", [
      "contains",
      "starts",
      "ends",
      "equals",
      "not-equals",
    ]),
  ],
  charts: [
    text("title", "Title", "Weekly requests", "Quarterly activity"),
    text("series", "Series label", "Requests", "Completed work"),
    text("categories", "Category labels", "Mon,Tue,Wed", "Q1,Q2,Q3"),
    number("height", "Chart height (px)", 384, 200, 640, 280),
    number("value", "Gauge value", 65, 0, 100, 90),
    choice("kind", "Chart kind", "bar", [
      "bar",
      "line",
      "area",
      "scatter",
      "pie",
      "doughnut",
      "radar",
      "gauge",
      "heatmap",
      "funnel",
      "treemap",
      "sunburst",
      "boxplot",
      "candlestick",
    ]),
  ],
  scheduler: [
    text("date", "Active date", "2026-11-12", "2026-12-01"),
    choice("view", "Calendar view", "month", [
      "month",
      "week",
      "day",
      "agenda",
    ]),
    choice("zone", "Time zone", "Europe/Dublin", [
      "Europe/Dublin",
      "UTC",
      "local",
      "America/New_York",
      "Asia/Tokyo",
    ]),
    number("firstDay", "First weekday (Sunday 0)", 1, 0, 6, 0),
    flag("weekends", "Show weekends", true),
    flag("weekNumbers", "Week numbers"),
    flag("now", "Current-time indicator", true),
    choice("slot", "Time slots", "00:30:00", [
      "00:15:00",
      "00:30:00",
      "01:00:00",
    ]),
    choice("dayStart", "Day starts", "00:00:00", [
      "00:00:00",
      "06:00:00",
      "08:00:00",
    ]),
    choice("dayEnd", "Day ends", "24:00:00", [
      "18:00:00",
      "20:00:00",
      "24:00:00",
    ]),
    number("limit", "Visible events per day", 3, 1, 10, 1),
    text("title", "Review title", "Design review", "Planning workshop"),
    flag("allDay", "All-day review"),
    flag("editable", "Allow moving review", true),
    flag("recurring", "Repeat planning weekly", true),
    number("interval", "Planning interval (weeks)", 1, 1, 8, 2),
    flag("readonly", "Read-only"),
    flag("empty", "Empty calendar"),
  ],
  taskboard: [
    label("Project work"),
    flag("empty", "Empty board"),
    text(
      "title",
      "1st task title",
      "Review colour tokens",
      "Review keyboard navigation",
    ),
    text(
      "description",
      "1st task description",
      "Check contrast in both themes.",
      "Try every control without a pointer.",
    ),
    flag("readonly", "Read-only board"),
  ],
  texteditor: [
    flag("readonly", "Read-only"),
    choice("sample", "Sample document", "text", [
      "text",
      "plan",
      "list",
      "markdown",
    ]),
    number("width", "Editor width (px)", 960, 240, 1200, 480),
    text(
      "text",
      "Document text",
      "Make room for your next idea.",
      "Write your own project notes.",
    ),
  ],
  codeblock: [
    label("Gleam greeting"),
    choice("language", "Source language", "gleam", [
      "gleam",
      "json",
      "toml",
      "html",
    ]),
    text(
      "source",
      "Source",
      'import gleam/io\n\n// A small, typed greeting\npub fn main() {\n  let name = "Meridian"\n  io.println("Hello, " <> name)\n}\n',
      "pub fn answer() { 42 }",
    ),
  ],
  icons: [
    choice("style", "Icon treatment", "auto", [
      "auto",
      "outline",
      "soft",
      "duotone",
    ]),
    text("query", "Search icons", "", "git"),
    choice("category", "Category", "all", [
      "all",
      "navigation",
      "actions",
      "files",
      "media",
      "people",
      "communication",
      "security",
      "development",
      "data",
      "nature",
      "editor",
      "brands",
      "cloud",
      "compute",
      "storage",
      "networking",
      "containers",
      "operations",
    ]),
    number("size", "Icon size (px)", 32, 16, 64, 48),
    choice("stroke", "Stroke width", "auto", ["auto", "1.5", "2", "2.5"]),
    choice("colour", "Colour", "accent", ["accent", "ink", "muted"]),
  ],
};

export function propertiesFor(id) {
  if (!Object.hasOwn(definitions, id))
    throw new Error(`Missing preview properties: ${id}`);
  const properties = definitions[id];
  const defaults = Object.fromEntries(
    properties.map((property) => [property.name, property.value]),
  );
  return {
    properties,
    examples: [
      { name: "Default", values: defaults },
      ...properties.map((property) => ({
        name: property.label,
        values: {
          ...defaults,
          ...(id === "codeblock" && property.name === "language"
            ? {
                label: "JSON configuration",
                source:
                  '{\n  "project": "Meridian",\n  "enabled": true,\n  "count": 3\n}',
              }
            : {}),
          ...(id === "button" && property.name === "iconPosition"
            ? { icon: "check" }
            : {}),
          ...(id === "filterservice" && property.name === "match"
            ? { query: "a" }
            : {}),
          ...(id === "scheduler" &&
          ["now", "slot", "dayStart", "dayEnd"].includes(property.name)
            ? { view: "week" }
            : {}),
          ...(id === "charts" && property.name === "value"
            ? { kind: "gauge" }
            : {}),
          ...(id === "table" && ["fail", "latency"].includes(property.name)
            ? { mode: "server" }
            : {}),
          [property.name]: property.alternate,
        },
      })),
      ...(id === "rating"
        ? [
            {
              name: "Half stars",
              values: { ...defaults, step: "0.5", value: "2.5" },
            },
          ]
        : []),
    ],
  };
}

export function validateProperties(properties, values) {
  if (!values || typeof values !== "object" || Array.isArray(values))
    return null;
  const allowed = new Map(
    properties.map((property) => [property.name, property]),
  );
  for (const [name, value] of Object.entries(values)) {
    const property = allowed.get(name);
    if (!property || typeof value !== "string" || value.length > 10000)
      return null;
    if (property.type === "boolean" && !["true", "false"].includes(value))
      return null;
    if (property.type === "choice" && !property.options.includes(value))
      return null;
    if (
      property.type === "number" &&
      (!/^-?\d+(?:\.\d+)?$/.test(value) ||
        Number(value) < property.min ||
        Number(value) > property.max ||
        Math.abs(
          (Number(value) - property.min) / property.step -
            Math.round((Number(value) - property.min) / property.step),
        ) > 1e-7)
    )
      return null;
  }
  return values;
}
