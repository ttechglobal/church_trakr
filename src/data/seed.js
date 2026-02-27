// src/data/seed.js
// All dummy data used across the app.
// When Supabase is integrated, replace these imports with API calls.

export const INIT_GROUPS = [
  { id: 1, name: "Youth Ministry",    leader: "James Okon",     church_id: "church_001" },
  { id: 2, name: "Women's Fellowship",leader: "Grace Adeyemi",  church_id: "church_001" },
  { id: 3, name: "Men's Fellowship",  leader: "Pastor Samuel",  church_id: "church_001" },
  { id: 4, name: "Children's Church", leader: "Blessing Nwosu", church_id: "church_001" },
  { id: 5, name: "Choir",             leader: "Taiwo Bello",    church_id: "church_001" },
];

export const INIT_MEMBERS = [
  { id: 1, name: "Adaeze Okafor",    phone: "08012345678", address: "14 Lagos Rd, Ikeja",   birthday: "1998-03-12", groupIds: [1], status: "active",   church_id: "church_001" },
  { id: 2, name: "Chukwuemeka Eze",  phone: "08098765432", address: "",                     birthday: "",           groupIds: [3], status: "active",   church_id: "church_001" },
  { id: 3, name: "Funke Adesola",    phone: "07011223344", address: "22 Awolowo Ave, VI",   birthday: "1990-07-04", groupIds: [2], status: "active",   church_id: "church_001" },
  { id: 4, name: "Tunde Bakare",     phone: "08155667788", address: "",                     birthday: "1995-11-20", groupIds: [1], status: "active",   church_id: "church_001" },
  { id: 5, name: "Ngozi Obi",        phone: "09022334455", address: "5 Church St, Surulere",birthday: "",           groupIds: [5], status: "active",   church_id: "church_001" },
  { id: 6, name: "Emeka Nwosu",      phone: "08077889900", address: "",                     birthday: "",           groupIds: [3], status: "inactive", church_id: "church_001" },
  { id: 7, name: "Amaka Chukwu",     phone: "07033445566", address: "8 Broad St, Marina",   birthday: "1992-05-30", groupIds: [2], status: "active",   church_id: "church_001" },
  { id: 8, name: "Segun Lawal",      phone: "08144556677", address: "",                     birthday: "2000-01-15", groupIds: [1], status: "active",   church_id: "church_001" },
];

export const INIT_ATTENDANCE = [
  {
    id: 1, groupId: 1, date: "2025-02-16", church_id: "church_001",
    records: [
      { memberId: 1, name: "Adaeze Okafor", present: true  },
      { memberId: 4, name: "Tunde Bakare",  present: false },
      { memberId: 8, name: "Segun Lawal",   present: true  },
    ],
  },
  {
    id: 2, groupId: 1, date: "2025-02-09", church_id: "church_001",
    records: [
      { memberId: 1, name: "Adaeze Okafor", present: true  },
      { memberId: 4, name: "Tunde Bakare",  present: true  },
      { memberId: 8, name: "Segun Lawal",   present: false },
    ],
  },
];

export const INIT_FIRST_TIMERS = [
  { id: 1, name: "Blessing Okoro", phone: "08199887766", date: "2025-02-16", church_id: "church_001" },
  { id: 2, name: "Daniel Achi",    phone: "07088776655", date: "2025-02-09", church_id: "church_001" },
];

export const INIT_MESSAGE_HISTORY = [
  {
    id: 1, church_id: "church_001",
    type: "absentees", recipients: 3, message: "Dear {name}, we missed you at service this Sunday. God bless you! 🙏",
    date: "2025-02-16", status: "sent", credits_used: 3,
  },
  {
    id: 2, church_id: "church_001",
    type: "group", recipients: 8, message: "Reminder: Service holds this Sunday at 9AM. God bless you!",
    date: "2025-02-09", status: "sent", credits_used: 8,
  },
  {
    id: 3, church_id: "church_001",
    type: "all", recipients: 12, message: "First Timer Welcome: Thank you for visiting Grace Baptist Church! We'd love to see you again.",
    date: "2025-02-02", status: "failed", credits_used: 0,
  },
  {
    id: 4, church_id: "church_001",
    type: "single", recipients: 1, message: "Pastor Samuel, your group meeting is confirmed for Friday. God bless.",
    date: "2025-01-26", status: "sent", credits_used: 1,
  },
];

export const SMS_TEMPLATES = [
  { id: "t1", label: "We missed you at church",   text: "Dear {name}, we missed you at service this Sunday. We love you and look forward to seeing you next week. God bless! 🙏" },
  { id: "t2", label: "First Timer Welcome",        text: "Dear {name}, thank you for visiting Grace Baptist Church! You are welcome here. We'd love to see you again this Sunday!" },
  { id: "t3", label: "Reminder: Service on Sunday",text: "Dear {name}, this is a reminder that Sunday service holds at 9:00 AM. We look forward to worshipping with you. God bless!" },
];
