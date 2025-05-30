const READING_PLAN_DATA = [
    { day: 1, oldTestament: { book: 'Genesis', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Matthew', startChapter: 1, endChapter: 1 } },
    { day: 2, oldTestament: { book: 'Genesis', startChapter: 3, endChapter: 5 }, newTestament: { book: 'Matthew', startChapter: 2, endChapter: 2 } },
    { day: 3, oldTestament: { book: 'Genesis', startChapter: 6, endChapter: 8 }, newTestament: { book: 'Matthew', startChapter: 3, endChapter: 3 } },
    { day: 4, oldTestament: { book: 'Genesis', startChapter: 9, endChapter: 11 }, newTestament: { book: 'Matthew', startChapter: 4, endChapter: 4 } },
    { day: 5, oldTestament: { book: 'Genesis', startChapter: 12, endChapter: 14 }, newTestament: { book: 'Matthew', startChapter: 5, startVerse: 1, endVerse: 26 } },
    { day: 6, oldTestament: { book: 'Genesis', startChapter: 15, endChapter: 17 }, newTestament: { book: 'Matthew', startChapter: 5, startVerse: 27, endVerse: 48 } },
    { day: 7, oldTestament: { book: 'Genesis', startChapter: 18, endChapter: 19 }, newTestament: { book: 'Matthew', startChapter: 6, endChapter: 6 } },
    { day: 8, oldTestament: { book: 'Genesis', startChapter: 20, endChapter: 22 }, newTestament: { book: 'Matthew', startChapter: 7, endChapter: 7 } },
    { day: 9, oldTestament: { book: 'Genesis', startChapter: 23, endChapter: 24 }, newTestament: { book: 'Matthew', startChapter: 8, endChapter: 8 } },
    { day: 10, oldTestament: { book: 'Genesis', startChapter: 25, endChapter: 26 }, newTestament: { book: 'Matthew', startChapter: 9, startVerse: 1, endVerse: 17 } },
    { day: 11, oldTestament: { book: 'Genesis', startChapter: 27, endChapter: 28 }, newTestament: { book: 'Matthew', startChapter: 9, startVerse: 18, endVerse: 38 } },
    { day: 12, oldTestament: { book: 'Genesis', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Matthew', startChapter: 10, startVerse: 1, endVerse: 23 } },
    { day: 13, oldTestament: { book: 'Genesis', startChapter: 31, endChapter: 32 }, newTestament: { book: 'Matthew', startChapter: 10, startVerse: 24, endVerse: 42 } },
    { day: 14, oldTestament: { book: 'Genesis', startChapter: 33, endChapter: 35 }, newTestament: { book: 'Matthew', startChapter: 11, endChapter: 11 } },
    { day: 15, oldTestament: { book: 'Genesis', startChapter: 36, endChapter: 37 }, newTestament: { book: 'Matthew', startChapter: 12, startVerse: 1, endVerse: 21 } },
    { day: 16, oldTestament: { book: 'Genesis', startChapter: 38, endChapter: 40 }, newTestament: { book: 'Matthew', startChapter: 12, startVerse: 22, endVerse: 50 } },
    { day: 17, oldTestament: { book: 'Genesis', startChapter: 41, endChapter: 41 }, newTestament: { book: 'Matthew', startChapter: 13, startVerse: 1, endVerse: 32 } },
    { day: 18, oldTestament: { book: 'Genesis', startChapter: 42, endChapter: 43 }, newTestament: { book: 'Matthew', startChapter: 13, startVerse: 33, endVerse: 58 } },
    { day: 19, oldTestament: { book: 'Genesis', startChapter: 44, endChapter: 45 }, newTestament: { book: 'Matthew', startChapter: 14, startVerse: 1, endVerse: 21 } },
    { day: 20, oldTestament: { book: 'Genesis', startChapter: 46, endChapter: 48 }, newTestament: { book: 'Matthew', startChapter: 14, startVerse: 22, endVerse: 36 } },
    { day: 21, oldTestament: { book: 'Genesis', startChapter: 49, endChapter: 50 }, newTestament: { book: 'Matthew', startChapter: 15, startVerse: 1, endVerse: 20 } },
    { day: 22, oldTestament: { book: 'Exodus', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Matthew', startChapter: 15, startVerse: 21, endVerse: 39 } },
    { day: 23, oldTestament: { book: 'Exodus', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Matthew', startChapter: 16, endChapter: 16 } },
    { day: 24, oldTestament: { book: 'Exodus', startChapter: 7, endChapter: 8 }, newTestament: { book: 'Matthew', startChapter: 17, endChapter: 17 } },
    { day: 25, oldTestament: { book: 'Exodus', startChapter: 9, endChapter: 10 }, newTestament: { book: 'Matthew', startChapter: 18, startVerse: 1, endVerse: 20 } },
    { day: 26, oldTestament: { book: 'Exodus', startChapter: 11, endChapter: 12 }, newTestament: { book: 'Matthew', startChapter: 18, startVerse: 21, endVerse: 35 } },
    { day: 27, oldTestament: { book: 'Exodus', startChapter: 13, endChapter: 15 }, newTestament: { book: 'Matthew', startChapter: 19, startVerse: 1, endVerse: 15 } },
    { day: 28, oldTestament: { book: 'Exodus', startChapter: 16, endChapter: 18 }, newTestament: { book: 'Matthew', startChapter: 19, startVerse: 16, endVerse: 30 } },
    { day: 29, oldTestament: { book: 'Exodus', startChapter: 19, endChapter: 21 }, newTestament: { book: 'Matthew', startChapter: 20, startVerse: 1, endVerse: 16 } },
    { day: 30, oldTestament: { book: 'Exodus', startChapter: 22, endChapter: 24 }, newTestament: { book: 'Matthew', startChapter: 20, startVerse: 17, endVerse: 34 } },
    { day: 31, oldTestament: { book: 'Exodus', startChapter: 25, endChapter: 26 }, newTestament: { book: 'Matthew', startChapter: 21, startVerse: 1, endVerse: 22 } },
    // February
    { day: 32, oldTestament: { book: 'Exodus', startChapter: 27, endChapter: 28 }, newTestament: { book: 'Matthew', startChapter: 21, startVerse: 23, endVerse: 46 } },
    { day: 33, oldTestament: { book: 'Exodus', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Matthew', startChapter: 22, startVerse: 1, endVerse: 22 } },
    { day: 34, oldTestament: { book: 'Exodus', startChapter: 31, endChapter: 33 }, newTestament: { book: 'Matthew', startChapter: 22, startVerse: 23, endVerse: 46 } },
    { day: 35, oldTestament: { book: 'Exodus', startChapter: 34, endChapter: 36 }, newTestament: { book: 'Matthew', startChapter: 23, startVerse: 1, endVerse: 22 } },
    { day: 36, oldTestament: { book: 'Exodus', startChapter: 37, endChapter: 38 }, newTestament: { book: 'Matthew', startChapter: 23, startVerse: 23, endVerse: 39 } },
    { day: 37, oldTestament: { book: 'Exodus', startChapter: 39, endChapter: 40 }, newTestament: { book: 'Matthew', startChapter: 24, startVerse: 1, endVerse: 22 } },
    { day: 38, oldTestament: { book: 'Leviticus', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Matthew', startChapter: 24, startVerse: 23, endVerse: 51 } },
    { day: 39, oldTestament: { book: 'Leviticus', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Matthew', startChapter: 25, startVerse: 1, endVerse: 30 } },
    { day: 40, oldTestament: { book: 'Leviticus', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Matthew', startChapter: 25, startVerse: 31, endVerse: 46 } },
    { day: 41, oldTestament: { book: 'Leviticus', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Matthew', startChapter: 26, startVerse: 1, endVerse: 19 } },
    { day: 42, oldTestament: { book: 'Leviticus', startChapter: 13, endChapter: 13 }, newTestament: { book: 'Matthew', startChapter: 26, startVerse: 20, endVerse: 54 } },
    { day: 43, oldTestament: { book: 'Leviticus', startChapter: 14, endChapter: 14 }, newTestament: { book: 'Matthew', startChapter: 26, startVerse: 55, endVerse: 75 } },
    { day: 44, oldTestament: { book: 'Leviticus', startChapter: 15, endChapter: 17 }, newTestament: { book: 'Matthew', startChapter: 27, startVerse: 1, endVerse: 31 } },
    { day: 45, oldTestament: { book: 'Leviticus', startChapter: 18, endChapter: 19 }, newTestament: { book: 'Matthew', startChapter: 27, startVerse: 32, endVerse: 66 } },
    { day: 46, oldTestament: { book: 'Leviticus', startChapter: 20, endChapter: 21 }, newTestament: { book: 'Matthew', startChapter: 28, endChapter: 28 } },
    { day: 47, oldTestament: { book: 'Leviticus', startChapter: 22, endChapter: 23 }, newTestament: { book: 'Mark', startChapter: 1, startVerse: 1, endVerse: 22 } },
    { day: 48, oldTestament: { book: 'Leviticus', startChapter: 24, endChapter: 25 }, newTestament: { book: 'Mark', startChapter: 1, startVerse: 23, endVerse: 45 } },
    { day: 49, oldTestament: { book: 'Leviticus', startChapter: 26, endChapter: 27 }, newTestament: { book: 'Mark', startChapter: 2, endChapter: 2 } },
    { day: 50, oldTestament: { book: 'Numbers', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Mark', startChapter: 3, startVerse: 1, endVerse: 21 } },
    { day: 51, oldTestament: { book: 'Numbers', startChapter: 3, endChapter: 4 }, newTestament: { book: 'Mark', startChapter: 3, startVerse: 22, endVerse: 35 } },
    { day: 52, oldTestament: { book: 'Numbers', startChapter: 5, endChapter: 6 }, newTestament: { book: 'Mark', startChapter: 4, startVerse: 1, endVerse: 20 } },
    { day: 53, oldTestament: { book: 'Numbers', startChapter: 7, endChapter: 8 }, newTestament: { book: 'Mark', startChapter: 4, startVerse: 21, endVerse: 41 } },
    { day: 54, oldTestament: { book: 'Numbers', startChapter: 9, endChapter: 11 }, newTestament: { book: 'Mark', startChapter: 5, startVerse: 1, endVerse: 20 } },
    { day: 55, oldTestament: { book: 'Numbers', startChapter: 12, endChapter: 14 }, newTestament: { book: 'Mark', startChapter: 5, startVerse: 21, endVerse: 43 } },
    { day: 56, oldTestament: { book: 'Numbers', startChapter: 15, endChapter: 17 }, newTestament: { book: 'Mark', startChapter: 6, startVerse: 1, endVerse: 32 } },
    { day: 57, oldTestament: { book: 'Numbers', startChapter: 18, endChapter: 20 }, newTestament: { book: 'Mark', startChapter: 6, startVerse: 33, endVerse: 56 } },
    { day: 58, oldTestament: { book: 'Numbers', startChapter: 21, endChapter: 22 }, newTestament: { book: 'Mark', startChapter: 7, startVerse: 1, endVerse: 13 } },
    { day: 59, oldTestament: { book: 'Numbers', startChapter: 23, endChapter: 24 }, newTestament: { book: 'Mark', startChapter: 7, startVerse: 14, endVerse: 37 } },
    // March
    { day: 60, oldTestament: { book: 'Numbers', startChapter: 25, endChapter: 27 }, newTestament: { book: 'Mark', startChapter: 8, endChapter: 8 } },
    { day: 61, oldTestament: { book: 'Numbers', startChapter: 28, endChapter: 29 }, newTestament: { book: 'Mark', startChapter: 9, startVerse: 1, endVerse: 29 } },
    { day: 62, oldTestament: { book: 'Numbers', startChapter: 30, endChapter: 31 }, newTestament: { book: 'Mark', startChapter: 9, startVerse: 30, endVerse: 50 } },
    { day: 63, oldTestament: { book: 'Numbers', startChapter: 32, endChapter: 33 }, newTestament: { book: 'Mark', startChapter: 10, startVerse: 1, endVerse: 31 } },
    { day: 64, oldTestament: { book: 'Numbers', startChapter: 34, endChapter: 36 }, newTestament: { book: 'Mark', startChapter: 10, startVerse: 32, endVerse: 52 } },
    { day: 65, oldTestament: { book: 'Deuteronomy', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Mark', startChapter: 11, startVerse: 1, endVerse: 19 } },
    { day: 66, oldTestament: { book: 'Deuteronomy', startChapter: 3, endChapter: 4 }, newTestament: { book: 'Mark', startChapter: 11, startVerse: 20, endVerse: 33 } },
    { day: 67, oldTestament: { book: 'Deuteronomy', startChapter: 5, endChapter: 7 }, newTestament: { book: 'Mark', startChapter: 12, startVerse: 1, endVerse: 27 } },
    { day: 68, oldTestament: { book: 'Deuteronomy', startChapter: 8, endChapter: 10 }, newTestament: { book: 'Mark', startChapter: 12, startVerse: 28, endVerse: 44 } },
    { day: 69, oldTestament: { book: 'Deuteronomy', startChapter: 11, endChapter: 13 }, newTestament: { book: 'Mark', startChapter: 13, startVerse: 1, endVerse: 13 } },
    { day: 70, oldTestament: { book: 'Deuteronomy', startChapter: 14, endChapter: 16 }, newTestament: { book: 'Mark', startChapter: 13, startVerse: 14, endVerse: 37 } },
    { day: 71, oldTestament: { book: 'Deuteronomy', startChapter: 17, endChapter: 19 }, newTestament: { book: 'Mark', startChapter: 14, startVerse: 1, endVerse: 25 } },
    { day: 72, oldTestament: { book: 'Deuteronomy', startChapter: 20, endChapter: 22 }, newTestament: { book: 'Mark', startChapter: 14, startVerse: 26, endVerse: 50 } },
    { day: 73, oldTestament: { book: 'Deuteronomy', startChapter: 23, endChapter: 25 }, newTestament: { book: 'Mark', startChapter: 14, startVerse: 51, endVerse: 72 } },
    { day: 74, oldTestament: { book: 'Deuteronomy', startChapter: 26, endChapter: 27 }, newTestament: { book: 'Mark', startChapter: 15, startVerse: 1, endVerse: 26 } },
    { day: 75, oldTestament: { book: 'Deuteronomy', startChapter: 28, endChapter: 28 }, newTestament: { book: 'Mark', startChapter: 15, startVerse: 27, endVerse: 47 } },
    { day: 76, oldTestament: { book: 'Deuteronomy', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Mark', startChapter: 16, endChapter: 1616 } },
    { day: 77, oldTestament: { book: 'Deuteronomy', startChapter: 31, endChapter: 32 }, newTestament: { book: 'Luke', startChapter: 1, startVerse: 1, endVerse: 23 } },
    { day: 78, oldTestament: { book: 'Deuteronomy', startChapter: 33, endChapter: 34 }, newTestament: { book: 'Luke', startChapter: 1, startVerse: 24, endVerse: 56 } },
    { day: 79, oldTestament: { book: 'Joshua', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Luke', startChapter: 1, startVerse: 57, endVerse: 80 } },
    { day: 80, oldTestament: { book: 'Joshua', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Luke', startChapter: 2, startVerse: 1, endVerse: 24 } },
    { day: 81, oldTestament: { book: 'Joshua', startChapter: 7, endChapter: 8 }, newTestament: { book: 'Luke', startChapter: 2, startVerse: 25, endVerse: 52 } },
    { day: 82, oldTestament: { book: 'Joshua', startChapter: 9, endChapter: 10 }, newTestament: { book: 'Luke', startChapter: 3, endChapter: 3 } },
    { day: 83, oldTestament: { book: 'Joshua', startChapter: 11, endChapter: 13 }, newTestament: { book: 'Luke', startChapter: 4, startVerse: 1, endVerse: 32 } },
    { day: 84, oldTestament: { book: 'Joshua', startChapter: 14, endChapter: 15 }, newTestament: { book: 'Luke', startChapter: 4, startVerse: 33, endVerse: 44 } },
    { day: 85, oldTestament: { book: 'Joshua', startChapter: 16, endChapter: 18 }, newTestament: { book: 'Luke', startChapter: 5, startVerse: 1, endVerse: 16 } },
    { day: 86, oldTestament: { book: 'Joshua', startChapter: 19, endChapter: 20 }, newTestament: { book: 'Luke', startChapter: 5, startVerse: 17, endVerse: 39 } },
    { day: 87, oldTestament: { book: 'Joshua', startChapter: 21, endChapter: 22 }, newTestament: { book: 'Luke', startChapter: 6, startVerse: 1, endVerse: 26 } },
    { day: 88, oldTestament: { book: 'Joshua', startChapter: 23, endChapter: 24 }, newTestament: { book: 'Luke', startChapter: 6, startVerse: 27, endVerse: 49 } },
    { day: 89, oldTestament: { book: 'Judges', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Luke', startChapter: 7, startVerse: 1, endVerse: 30 } },
    { day: 90, oldTestament: { book: 'Judges', startChapter: 3, endChapter: 5 }, newTestament: { book: 'Luke', startChapter: 7, startVerse: 31, endVerse: 50 } },
    // April
    { day: 91, oldTestament: { book: 'Judges', startChapter: 6, endChapter: 7 }, newTestament: { book: 'Luke', startChapter: 8, startVerse: 1, endVerse: 21 } },
    { day: 92, oldTestament: { book: 'Judges', startChapter: 8, endChapter: 9 }, newTestament: { book: 'Luke', startChapter: 8, startVerse: 22, endVerse: 56 } },
    { day: 93, oldTestament: { book: 'Judges', startChapter: 10, endChapter: 11 }, newTestament: { book: 'Luke', startChapter: 9, startVerse: 1, endVerse: 36 } },
    { day: 94, oldTestament: { book: 'Judges', startChapter: 12, endChapter: 14 }, newTestament: { book: 'Luke', startChapter: 9, startVerse: 37, endVerse: 62 } },
    { day: 95, oldTestament: { book: 'Judges', startChapter: 15, endChapter: 17 }, newTestament: { book: 'Luke', startChapter: 10, startVerse: 1, endVerse: 24 } },
    { day: 96, oldTestament: { book: 'Judges', startChapter: 18, endChapter: 19 }, newTestament: { book: 'Luke', startChapter: 10, startVerse: 25, endVerse: 42 } },
    { day: 97, oldTestament: { book: 'Judges', startChapter: 20, endChapter: 21 }, newTestament: { book: 'Luke', startChapter: 11, startVerse: 1, endVerse: 28 } },
    { day: 98, oldTestament: { book: 'Ruth', startChapter: 1, endChapter: 4 }, newTestament: { book: 'Luke', startChapter: 11, startVerse: 29, endVerse: 54 } },
    { day: 99, oldTestament: { book: '1 Samuel', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Luke', startChapter: 12, startVerse: 1, endVerse: 34 } },
    { day: 100, oldTestament: { book: '1 Samuel', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Luke', startChapter: 12, startVerse: 35, endVerse: 59 } },
    { day: 101, oldTestament: { book: '1 Samuel', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Luke', startChapter: 13, startVerse: 1, endVerse: 21 } },
    { day: 102, oldTestament: { book: '1 Samuel', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Luke', startChapter: 13, startVerse: 22, endVerse: 35 } },
    { day: 103, oldTestament: { book: '1 Samuel', startChapter: 13, endChapter: 14 }, newTestament: { book: 'Luke', startChapter: 14, startVerse: 1, endVerse: 24 } },
    { day: 104, oldTestament: { book: '1 Samuel', startChapter: 15, endChapter: 16 }, newTestament: { book: 'Luke', startChapter: 14, startVerse: 25, endVerse: 35 } },
    { day: 105, oldTestament: { book: '1 Samuel', startChapter: 17, endChapter: 18 }, newTestament: { book: 'Luke', startChapter: 15, startVerse: 1, endVerse: 10 } },
    { day: 106, oldTestament: { book: '1 Samuel', startChapter: 19, endChapter: 21 }, newTestament: { book: 'Luke', startChapter: 15, startVerse: 11, endVerse: 32 } },
    { day: 107, oldTestament: { book: '1 Samuel', startChapter: 22, endChapter: 24 }, newTestament: { book: 'Luke', startChapter: 16, startVerse: 1, endVerse: 18 } },
    { day: 108, oldTestament: { book: '1 Samuel', startChapter: 25, endChapter: 26 }, newTestament: { book: 'Luke', startChapter: 16, startVerse: 19, endVerse: 31 } },
    { day: 109, oldTestament: { book: '1 Samuel', startChapter: 27, endChapter: 29 }, newTestament: { book: 'Luke', startChapter: 17, startVerse: 1, endVerse: 19 } },
    { day: 110, oldTestament: { book: '1 Samuel', startChapter: 30, endChapter: 31 }, newTestament: { book: 'Luke', startChapter: 17, startVerse: 20, endVerse: 37 } },
    { day: 111, oldTestament: { book: '2 Samuel', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Luke', startChapter: 18, startVerse: 1, endVerse: 17 } },
    { day: 112, oldTestament: { book: '2 Samuel', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Luke', startChapter: 18, startVerse: 18, endVerse: 43 } },
    { day: 113, oldTestament: { book: '2 Samuel', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Luke', startChapter: 19, startVerse: 1, endVerse: 28 } },
    { day: 114, oldTestament: { book: '2 Samuel', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Luke', startChapter: 19, startVerse: 29, endVerse: 48 } },
    { day: 115, oldTestament: { book: '2 Samuel', startChapter: 13, endChapter: 14 }, newTestament: { book: 'Luke', startChapter: 20, startVerse: 1, endVerse: 26 } },
    { day: 116, oldTestament: { book: '2 Samuel', startChapter: 15, endChapter: 16 }, newTestament: { book: 'Luke', startChapter: 20, startVerse: 27, endVerse: 47 } },
    { day: 117, oldTestament: { book: '2 Samuel', startChapter: 17, endChapter: 18 }, newTestament: { book: 'Luke', startChapter: 21, startVerse: 1, endVerse: 19 } },
    { day: 118, oldTestament: { book: '2 Samuel', startChapter: 19, endChapter: 20 }, newTestament: { book: 'Luke', startChapter: 21, startVerse: 20, endVerse: 38 } },
    { day: 119, oldTestament: { book: '2 Samuel', startChapter: 21, endChapter: 22 }, newTestament: { book: 'Luke', startChapter: 22, startVerse: 1, endVerse: 30 } },
    { day: 120, oldTestament: { book: '2 Samuel', startChapter: 23, endChapter: 24 }, newTestament: { book: 'Luke', startChapter: 22, startVerse: 31, endVerse: 53 } },
    // May
    { day: 121, oldTestament: { book: '1 Kings', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Luke', startChapter: 22, startVerse: 54, endVerse: 71 } },
    { day: 122, oldTestament: { book: '1 Kings', startChapter: 3, endChapter: 5 }, newTestament: { book: 'Luke', startChapter: 23, startVerse: 1, endVerse: 26 } },
    { day: 123, oldTestament: { book: '1 Kings', startChapter: 6, endChapter: 7 }, newTestament: { book: 'Luke', startChapter: 23, startVerse: 27, endVerse: 38 } },
    { day: 124, oldTestament: { book: '1 Kings', startChapter: 8, endChapter: 9 }, newTestament: { book: 'Luke', startChapter: 23, startVerse: 39, endVerse: 56 } },
    { day: 125, oldTestament: { book: '1 Kings', startChapter: 10, endChapter: 11 }, newTestament: { book: 'Luke', startChapter: 24, startVerse: 1, endVerse: 35 } },
    { day: 126, oldTestament: { book: '1 Kings', startChapter: 12, endChapter: 13 }, newTestament: { book: 'Luke', startChapter: 24, startVerse: 36, endVerse: 53 } },
    { day: 127, oldTestament: { book: '1 Kings', startChapter: 14, endChapter: 15 }, newTestament: { book: 'John', startChapter: 1, startVerse: 1, endVerse: 28 } },
    { day: 128, oldTestament: { book: '1 Kings', startChapter: 16, endChapter: 18 }, newTestament: { book: 'John', startChapter: 1, startVerse: 29, endVerse: 51 } },
    { day: 129, oldTestament: { book: '1 Kings', startChapter: 19, endChapter: 20 }, newTestament: { book: 'John', startChapter: 2, endChapter: 2 } },
    { day: 130, oldTestament: { book: '1 Kings', startChapter: 21, endChapter: 22 }, newTestament: { book: 'John', startChapter: 3, startVerse: 1, endVerse: 21 } },
    { day: 131, oldTestament: { book: '2 Kings', startChapter: 1, endChapter: 3 }, newTestament: { book: 'John', startChapter: 3, startVerse: 22, endVerse: 36 } },
    { day: 132, oldTestament: { book: '2 Kings', startChapter: 4, endChapter: 5 }, newTestament: { book: 'John', startChapter: 4, startVerse: 1, endVerse: 30 } },
    { day: 133, oldTestament: { book: '2 Kings', startChapter: 6, endChapter: 8 }, newTestament: { book: 'John', startChapter: 4, startVerse: 31, endVerse: 54 } },
    { day: 134, oldTestament: { book: '2 Kings', startChapter: 9, endChapter: 11 }, newTestament: { book: 'John', startChapter: 5, startVerse: 1, endVerse: 24 } },
    { day: 135, oldTestament: { book: '2 Kings', startChapter: 12, endChapter: 14 }, newTestament: { book: 'John', startChapter: 5, startVerse: 25, endVerse: 47 } },
    { day: 136, oldTestament: { book: '2 Kings', startChapter: 15, endChapter: 17 }, newTestament: { book: 'John', startChapter: 6, startVerse: 1, endVerse: 21 } },
    { day: 137, oldTestament: { book: '2 Kings', startChapter: 18, endChapter: 19 }, newTestament: { book: 'John', startChapter: 6, startVerse: 22, endVerse: 44 } },
    { day: 138, oldTestament: { book: '2 Kings', startChapter: 20, endChapter: 22 }, newTestament: { book: 'John', startChapter: 6, startVerse: 45, endVerse: 71 } },
    { day: 139, oldTestament: { book: '2 Kings', startChapter: 23, endChapter: 25 }, newTestament: { book: 'John', startChapter: 7, startVerse: 1, endVerse: 31 } },
    { day: 140, oldTestament: { book: '1 Chronicles', startChapter: 1, endChapter: 2 }, newTestament: { book: 'John', startChapter: 7, startVerse: 32, endVerse: 53 } },
    { day: 141, oldTestament: { book: '1 Chronicles', startChapter: 3, endChapter: 5 }, newTestament: { book: 'John', startChapter: 8, startVerse: 1, endVerse: 20 } },
    { day: 142, oldTestament: { book: '1 Chronicles', startChapter: 6, endChapter: 7 }, newTestament: { book: 'John', startChapter: 8, startVerse: 21, endVerse: 36 } },
    { day: 143, oldTestament: { book: '1 Chronicles', startChapter: 8, endChapter: 10 }, newTestament: { book: 'John', startChapter: 8, startVerse: 37, endVerse: 59 } },
    { day: 144, oldTestament: { book: '1 Chronicles', startChapter: 11, endChapter: 13 }, newTestament: { book: 'John', startChapter: 9, startVerse: 1, endVerse: 23 } },
    { day: 145, oldTestament: { book: '1 Chronicles', startChapter: 14, endChapter: 16 }, newTestament: { book: 'John', startChapter: 9, startVerse: 24, endVerse: 41 } },
    { day: 146, oldTestament: { book: '1 Chronicles', startChapter: 17, endChapter: 19 }, newTestament: { book: 'John', startChapter: 10, startVerse: 1, endVerse: 21 } },
    { day: 147, oldTestament: { book: '1 Chronicles', startChapter: 20, endChapter: 22 }, newTestament: { book: 'John', startChapter: 10, startVerse: 22, endVerse: 42 } },
    { day: 148, oldTestament: { book: '1 Chronicles', startChapter: 23, endChapter: 25 }, newTestament: { book: 'John', startChapter: 11, startVerse: 1, endVerse: 17 } },
    { day: 149, oldTestament: { book: '1 Chronicles', startChapter: 26, endChapter: 27 }, newTestament: { book: 'John', startChapter: 11, startVerse: 18, endVerse: 46 } },
    { day: 150, oldTestament: { book: '1 Chronicles', startChapter: 28, endChapter: 29 }, newTestament: { book: 'John', startChapter: 11, startVerse: 47, endVerse: 57 } },
    // June
    { day: 151, oldTestament: { book: '2 Chronicles', startChapter: 1, endChapter: 3 }, newTestament: { book: 'John', startChapter: 12, startVerse: 1, endVerse: 19 } },
    { day: 152, oldTestament: { book: '2 Chronicles', startChapter: 4, endChapter: 6 }, newTestament: { book: 'John', startChapter: 12, startVerse: 20, endVerse: 50 } },
    { day: 153, oldTestament: { book: '2 Chronicles', startChapter: 7, endChapter: 9 }, newTestament: { book: 'John', startChapter: 13, startVerse: 1, endVerse: 17 } },
    { day: 154, oldTestament: { book: '2 Chronicles', startChapter: 10, endChapter: 12 }, newTestament: { book: 'John', startChapter: 13, startVerse: 18, endVerse: 38 } },
    { day: 155, oldTestament: { book: '2 Chronicles', startChapter: 13, endChapter: 16 }, newTestament: { book: 'John', startChapter: 14, endChapter: 14 } },
    { day: 156, oldTestament: { book: '2 Chronicles', startChapter: 17, endChapter: 19 }, newTestament: { book: 'John', startChapter: 15, endChapter: 15 } },
    { day: 157, oldTestament: { book: '2 Chronicles', startChapter: 20, endChapter: 22 }, newTestament: { book: 'John', startChapter: 16, startVerse: 1, endVerse: 15 } },
    { day: 158, oldTestament: { book: '2 Chronicles', startChapter: 23, endChapter: 25 }, newTestament: { book: 'John', startChapter: 16, startVerse: 16, endVerse: 33 } },
    { day: 159, oldTestament: { book: '2 Chronicles', startChapter: 26, endChapter: 28 }, newTestament: { book: 'John', startChapter: 17, endChapter: 17 } },
    { day: 160, oldTestament: { book: '2 Chronicles', startChapter: 29, endChapter: 31 }, newTestament: { book: 'John', startChapter: 18, startVerse: 1, endVerse: 23 } },
    { day: 161, oldTestament: { book: '2 Chronicles', startChapter: 32, endChapter: 33 }, newTestament: { book: 'John', startChapter: 18, startVerse: 24, endVerse: 40 } },
    { day: 162, oldTestament: { book: '2 Chronicles', startChapter: 34, endChapter: 36 }, newTestament: { book: 'John', startChapter: 19, startVerse: 1, endVerse: 22 } },
    { day: 163, oldTestament: { book: 'Ezra', startChapter: 1, endChapter: 2 }, newTestament: { book: 'John', startChapter: 19, startVerse: 23, endVerse: 42 } },
    { day: 164, oldTestament: { book: 'Ezra', startChapter: 3, endChapter: 5 }, newTestament: { book: 'John', startChapter: 20, endChapter: 20 } },
    { day: 165, oldTestament: { book: 'Ezra', startChapter: 6, endChapter: 8 }, newTestament: { book: 'John', startChapter: 21, endChapter: 21 } },
    { day: 166, oldTestament: { book: 'Ezra', startChapter: 9, endChapter: 10 }, newTestament: { book: 'Acts', startChapter: 1, endChapter: 1 } },
    { day: 167, oldTestament: { book: 'Nehemiah', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Acts', startChapter: 2, startVerse: 1, endVerse: 13 } },
    { day: 168, oldTestament: { book: 'Nehemiah', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Acts', startChapter: 2, startVerse: 14, endVerse: 47 } },
    { day: 169, oldTestament: { book: 'Nehemiah', startChapter: 7, endChapter: 8 }, newTestament: { book: 'Acts', startChapter: 3, endChapter: 3 } },
    { day: 170, oldTestament: { book: 'Nehemiah', startChapter: 9, endChapter: 11 }, newTestament: { book: 'Acts', startChapter: 4, startVerse: 1, endVerse: 22 } },
    { day: 171, oldTestament: { book: 'Nehemiah', startChapter: 12, endChapter: 13 }, newTestament: { book: 'Acts', startChapter: 4, startVerse: 23, endVerse: 37 } },
    { day: 172, oldTestament: { book: 'Esther', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Acts', startChapter: 5, startVerse: 1, endVerse: 16 } },
    { day: 173, oldTestament: { book: 'Esther', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Acts', startChapter: 5, startVerse: 17, endVerse: 42 } },
    { day: 174, oldTestament: { book: 'Esther', startChapter: 7, endChapter: 10 }, newTestament: { book: 'Acts', startChapter: 6, endChapter: 6 } },
    { day: 175, oldTestament: { book: 'Job', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Acts', startChapter: 7, startVerse: 1, endVerse: 19 } },
    { day: 176, oldTestament: { book: 'Job', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Acts', startChapter: 7, startVerse: 20, endVerse: 43 } },
    { day: 177, oldTestament: { book: 'Job', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Acts', startChapter: 7, startVerse: 44, endVerse: 60 } },
    { day: 178, oldTestament: { book: 'Job', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Acts', startChapter: 8, startVerse: 1, endVerse: 25 } },
    { day: 179, oldTestament: { book: 'Job', startChapter: 13, endChapter: 15 }, newTestament: { book: 'Acts', startChapter: 8, startVerse: 26, endVerse: 40 } },
    { day: 180, oldTestament: { book: 'Job', startChapter: 16, endChapter: 18 }, newTestament: { book: 'Acts', startChapter: 9, startVerse: 1, endVerse: 22 } },
    { day: 181, oldTestament: { book: 'Job', startChapter: 19, endChapter: 20 }, newTestament: { book: 'Acts', startChapter: 9, startVerse: 23, endVerse: 43 } },
    // July
    { day: 182, oldTestament: { book: 'Job', startChapter: 21, endChapter: 22 }, newTestament: { book: 'Acts', startChapter: 10, startVerse: 1, endVerse: 23 } },
    { day: 183, oldTestament: { book: 'Job', startChapter: 23, endChapter: 25 }, newTestament: { book: 'Acts', startChapter: 10, startVerse: 24, endVerse: 48 } },
    { day: 184, oldTestament: { book: 'Job', startChapter: 26, endChapter: 28 }, newTestament: { book: 'Acts', startChapter: 11, endChapter: 11 } },
    { day: 185, oldTestament: { book: 'Job', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Acts', startChapter: 12, endChapter: 12 } },
    { day: 186, oldTestament: { book: 'Job', startChapter: 31, endChapter: 32 }, newTestament: { book: 'Acts', startChapter: 13, startVerse: 1, endVerse: 23 } },
    { day: 187, oldTestament: { book: 'Job', startChapter: 33, endChapter: 34 }, newTestament: { book: 'Acts', startChapter: 13, startVerse: 24, endVerse: 52 } },
    { day: 188, oldTestament: { book: 'Job', startChapter: 35, endChapter: 37 }, newTestament: { book: 'Acts', startChapter: 14, endChapter: 14 } },
    { day: 189, oldTestament: { book: 'Job', startChapter: 38, endChapter: 39 }, newTestament: { book: 'Acts', startChapter: 15, startVerse: 1, endVerse: 21 } },
    { day: 190, oldTestament: { book: 'Job', startChapter: 40, endChapter: 42 }, newTestament: { book: 'Acts', startChapter: 15, startVerse: 22, endVerse: 41 } },
    { day: 191, oldTestament: { book: 'Psalm', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Acts', startChapter: 16, startVerse: 1, endVerse: 15 } },
    { day: 192, oldTestament: { book: 'Psalm', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Acts', startChapter: 16, startVerse: 16, endVerse: 40 } },
    { day: 193, oldTestament: { book: 'Psalm', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Acts', startChapter: 17, startVerse: 1, endVerse: 15 } },
    { day: 194, oldTestament: { book: 'Psalm', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Acts', startChapter: 17, startVerse: 16, endVerse: 34 } },
    { day: 195, oldTestament: { book: 'Psalm', startChapter: 13, endChapter: 16 }, newTestament: { book: 'Acts', startChapter: 18, endChapter: 18 } },
    { day: 196, oldTestament: { book: 'Psalm', startChapter: 17, endChapter: 18 }, newTestament: { book: 'Acts', startChapter: 19, startVerse: 1, endVerse: 20 } },
    { day: 197, oldTestament: { book: 'Psalm', startChapter: 19, endChapter: 21 }, newTestament: { book: 'Acts', startChapter: 19, startVerse: 21, endVerse: 41 } },
    { day: 198, oldTestament: { book: 'Psalm', startChapter: 22, endChapter: 24 }, newTestament: { book: 'Acts', startChapter: 20, startVerse: 1, endVerse: 16 } },
    { day: 199, oldTestament: { book: 'Psalm', startChapter: 25, endChapter: 27 }, newTestament: { book: 'Acts', startChapter: 20, startVerse: 17, endVerse: 38 } },
    { day: 200, oldTestament: { book: 'Psalm', startChapter: 28, endChapter: 30 }, newTestament: { book: 'Acts', startChapter: 21, startVerse: 1, endVerse: 14 } },
    { day: 201, oldTestament: { book: 'Psalm', startChapter: 31, endChapter: 33 }, newTestament: { book: 'Acts', startChapter: 21, startVerse: 15, endVerse: 40 } },
    { day: 202, oldTestament: { book: 'Psalm', startChapter: 34, endChapter: 35 }, newTestament: { book: 'Acts', startChapter: 22, endChapter: 22 } },
    { day: 203, oldTestament: { book: 'Psalm', startChapter: 36, endChapter: 37 }, newTestament: { book: 'Acts', startChapter: 23, startVerse: 1, endVerse: 11 } },
    { day: 204, oldTestament: { book: 'Psalm', startChapter: 38, endChapter: 40 }, newTestament: { book: 'Acts', startChapter: 23, startVerse: 12, endVerse: 35 } },
    { day: 205, oldTestament: { book: 'Psalm', startChapter: 41, endChapter: 43 }, newTestament: { book: 'Acts', startChapter: 24, endChapter: 24 } },
    { day: 206, oldTestament: { book: 'Psalm', startChapter: 44, endChapter: 46 }, newTestament: { book: 'Acts', startChapter: 25, endChapter: 25 } },
    { day: 207, oldTestament: { book: 'Psalm', startChapter: 47, endChapter: 49 }, newTestament: { book: 'Acts', startChapter: 26, endChapter: 26 } },
    { day: 208, oldTestament: { book: 'Psalm', startChapter: 50, endChapter: 52 }, newTestament: { book: 'Acts', startChapter: 27, startVerse: 1, endVerse: 25 } },
    { day: 209, oldTestament: { book: 'Psalm', startChapter: 53, endChapter: 55 }, newTestament: { book: 'Acts', startChapter: 27, startVerse: 26, endVerse: 44 } },
    { day: 210, oldTestament: { book: 'Psalm', startChapter: 56, endChapter: 58 }, newTestament: { book: 'Acts', startChapter: 28, startVerse: 1, endVerse: 15 } },
    { day: 211, oldTestament: { book: 'Psalm', startChapter: 59, endChapter: 61 }, newTestament: { book: 'Acts', startChapter: 28, startVerse: 16, endVerse: 31 } },
    { day: 212, oldTestament: { book: 'Psalm', startChapter: 62, endChapter: 64 }, newTestament: { book: 'Romans', startChapter: 1, endChapter: 1 } },
    // August
    { day: 213, oldTestament: { book: 'Psalm', startChapter: 65, endChapter: 67 }, newTestament: { book: 'Romans', startChapter: 2, endChapter: 2 } },
    { day: 214, oldTestament: { book: 'Psalm', startChapter: 68, endChapter: 69 }, newTestament: { book: 'Romans', startChapter: 3, endChapter: 3 } },
    { day: 215, oldTestament: { book: 'Psalm', startChapter: 70, endChapter: 72 }, newTestament: { book: 'Romans', startChapter: 4, endChapter: 4 } },
    { day: 216, oldTestament: { book: 'Psalm', startChapter: 73, endChapter: 74 }, newTestament: { book: 'Romans', startChapter: 5, endChapter: 5 } },
    { day: 217, oldTestament: { book: 'Psalm', startChapter: 75, endChapter: 77 }, newTestament: { book: 'Romans', startChapter: 6, endChapter: 6 } },
    { day: 218, oldTestament: { book: 'Psalm', startChapter: 78, endChapter: 78 }, newTestament: { book: 'Romans', startChapter: 7, endChapter: 7 } },
    { day: 219, oldTestament: { book: 'Psalm', startChapter: 79, endChapter: 81 }, newTestament: { book: 'Romans', startChapter: 8, startVerse: 1, endVerse: 18 } },
    { day: 220, oldTestament: { book: 'Psalm', startChapter: 82, endChapter: 84 }, newTestament: { book: 'Romans', startChapter: 8, startVerse: 19, endVerse: 39 } },
    { day: 221, oldTestament: { book: 'Psalm', startChapter: 85, endChapter: 87 }, newTestament: { book: 'Romans', startChapter: 9, endChapter: 9 } },
    { day: 222, oldTestament: { book: 'Psalm', startChapter: 88, endChapter: 89 }, newTestament: { book: 'Romans', startChapter: 10, endChapter: 10 } },
    { day: 223, oldTestament: { book: 'Psalm', startChapter: 90, endChapter: 92 }, newTestament: { book: 'Romans', startChapter: 11, startVerse: 1, endVerse: 21 } },
    { day: 224, oldTestament: { book: 'Psalm', startChapter: 93, endChapter: 95 }, newTestament: { book: 'Romans', startChapter: 11, startVerse: 22, endVerse: 36 } },
    { day: 225, oldTestament: { book: 'Psalm', startChapter: 96, endChapter: 98 }, newTestament: { book: 'Romans', startChapter: 12, endChapter: 12 } },
    { day: 226, oldTestament: { book: 'Psalm', startChapter: 99, endChapter: 102 }, newTestament: { book: 'Romans', startChapter: 13, endChapter: 13 } },
    { day: 227, oldTestament: { book: 'Psalm', startChapter: 103, endChapter: 104 }, newTestament: { book: 'Romans', startChapter: 14, endChapter: 14 } },
    { day: 228, oldTestament: { book: 'Psalm', startChapter: 105, endChapter: 106 }, newTestament: { book: 'Romans', startChapter: 15, startVerse: 1, endVerse: 20 } },
    { day: 229, oldTestament: { book: 'Psalm', startChapter: 107, endChapter: 108 }, newTestament: { book: 'Romans', startChapter: 15, startVerse: 21, endVerse: 33 } },
    { day: 230, oldTestament: { book: 'Psalm', startChapter: 109, endChapter: 111 }, newTestament: { book: 'Romans', startChapter: 16, endChapter: 16 } },
    { day: 231, oldTestament: { book: 'Psalm', startChapter: 112, endChapter: 115 }, newTestament: { book: '1 Corinthians', startChapter: 1, endChapter: 1 } },
    { day: 232, oldTestament: { book: 'Psalm', startChapter: 116, endChapter: 118 }, newTestament: { book: '1 Corinthians', startChapter: 2, endChapter: 2 } },
    { day: 233, oldTestament: { book: 'Psalm', startChapter: 119, startVerse: 1, endVerse: 48 }, newTestament: { book: '1 Corinthians', startChapter: 3, endChapter: 3 } },
    { day: 234, oldTestament: { book: 'Psalm', startChapter: 119, startVerse: 49, endVerse: 104 }, newTestament: { book: '1 Corinthians', startChapter: 4, endChapter: 4 } },
    { day: 235, oldTestament: { book: 'Psalm', startChapter: 119, startVerse: 105, endVerse: 176 }, newTestament: { book: '1 Corinthians', startChapter: 5, endChapter: 5 } },
    { day: 236, oldTestament: { book: 'Psalm', startChapter: 120, endChapter: 123 }, newTestament: { book: '1 Corinthians', startChapter: 6, endChapter: 6 } },
    { day: 237, oldTestament: { book: 'Psalm', startChapter: 124, endChapter: 127 }, newTestament: { book: '1 Corinthians', startChapter: 7, startVerse: 1, endVerse: 24 } },
    { day: 238, oldTestament: { book: 'Psalm', startChapter: 128, endChapter: 131 }, newTestament: { book: '1 Corinthians', startChapter: 7, startVerse: 25, endVerse: 40 } },
    { day: 239, oldTestament: { book: 'Psalm', startChapter: 132, endChapter: 135 }, newTestament: { book: '1 Corinthians', startChapter: 8, endChapter: 8 } },
    { day: 240, oldTestament: { book: 'Psalm', startChapter: 136, endChapter: 138 }, newTestament: { book: '1 Corinthians', startChapter: 9, endChapter: 9 } },
    { day: 241, oldTestament: { book: 'Psalm', startChapter: 139, endChapter: 141 }, newTestament: { book: '1 Corinthians', startChapter: 10, startVerse: 1, endVerse: 13 } },
    { day: 242, oldTestament: { book: 'Psalm', startChapter: 142, endChapter: 144 }, newTestament: { book: '1 Corinthians', startChapter: 10, startVerse: 14, endVerse: 33 } },
    { day: 243, oldTestament: { book: 'Psalm', startChapter: 145, endChapter: 147 }, newTestament: { book: '1 Corinthians', startChapter: 11, startVerse: 1, endVerse: 15 } },
    // September
    { day: 244, oldTestament: { book: 'Psalm', startChapter: 148, endChapter: 150 }, newTestament: { book: '1 Corinthians', startChapter: 11, startVerse: 16, endVerse: 34 } },
    { day: 245, oldTestament: { book: 'Proverbs', startChapter: 1, endChapter: 2 }, newTestament: { book: '1 Corinthians', startChapter: 12, endChapter: 12 } },
    { day: 246, oldTestament: { book: 'Proverbs', startChapter: 3, endChapter: 4 }, newTestament: { book: '1 Corinthians', startChapter: 13, endChapter: 13 } },
    { day: 247, oldTestament: { book: 'Proverbs', startChapter: 5, endChapter: 6 }, newTestament: { book: '1 Corinthians', startChapter: 14, startVerse: 1, endVerse: 20 } },
    { day: 248, oldTestament: { book: 'Proverbs', startChapter: 7, endChapter: 8 }, newTestament: { book: '1 Corinthians', startChapter: 14, startVerse: 21, endVerse: 40 } },
    { day: 249, oldTestament: { book: 'Proverbs', startChapter: 9, endChapter: 10 }, newTestament: { book: '1 Corinthians', startChapter: 15, startVerse: 1, endVerse: 32 } },
    { day: 250, oldTestament: { book: 'Proverbs', startChapter: 11, endChapter: 12 }, newTestament: { book: '1 Corinthians', startChapter: 15, startVerse: 33, endVerse: 58 } },
    { day: 251, oldTestament: { book: 'Proverbs', startChapter: 13, endChapter: 14 }, newTestament: { book: '1 Corinthians', startChapter: 16, endChapter: 16 } },
    { day: 252, oldTestament: { book: 'Proverbs', startChapter: 15, endChapter: 16 }, newTestament: { book: '2 Corinthians', startChapter: 1, endChapter: 1 } },
    { day: 253, oldTestament: { book: 'Proverbs', startChapter: 17, endChapter: 18 }, newTestament: { book: '2 Corinthians', startChapter: 2, endChapter: 2 } },
    { day: 254, oldTestament: { book: 'Proverbs', startChapter: 19, endChapter: 20 }, newTestament: { book: '2 Corinthians', startChapter: 3, endChapter: 3 } },
    { day: 255, oldTestament: { book: 'Proverbs', startChapter: 21, endChapter: 22 }, newTestament: { book: '2 Corinthians', startChapter: 4, endChapter: 4 } },
    { day: 256, oldTestament: { book: 'Proverbs', startChapter: 23, endChapter: 24 }, newTestament: { book: '2 Corinthians', startChapter: 5, endChapter: 5 } },
    { day: 257, oldTestament: { book: 'Proverbs', startChapter: 25, endChapter: 27 }, newTestament: { book: '2 Corinthians', startChapter: 6, endChapter: 6 } },
    { day: 258, oldTestament: { book: 'Proverbs', startChapter: 28, endChapter: 29 }, newTestament: { book: '2 Corinthians', startChapter: 7, endChapter: 7 } },
    { day: 259, oldTestament: { book: 'Proverbs', startChapter: 30, endChapter: 31 }, newTestament: { book: '2 Corinthians', startChapter: 8, endChapter: 8 } },
    { day: 260, oldTestament: { book: 'Ecclesiastes', startChapter: 1, endChapter: 3 }, newTestament: { book: '2 Corinthians', startChapter: 9, endChapter: 9 } },
    { day: 261, oldTestament: { book: 'Ecclesiastes', startChapter: 4, endChapter: 6 }, newTestament: { book: '2 Corinthians', startChapter: 10, endChapter: 10 } },
    { day: 262, oldTestament: { book: 'Ecclesiastes', startChapter: 7, endChapter: 9 }, newTestament: { book: '2 Corinthians', startChapter: 11, startVerse: 1, endVerse: 15 } },
    { day: 263, oldTestament: { book: 'Ecclesiastes', startChapter: 10, endChapter: 12 }, newTestament: { book: '2 Corinthians', startChapter: 11, startVerse: 16, endVerse: 33 } },
    { day: 264, oldTestament: { book: 'Song of Solomon', startChapter: 1, endChapter: 3 }, newTestament: { book: '2 Corinthians', startChapter: 12, endChapter: 12 } },
    { day: 265, oldTestament: { book: 'Song of Solomon', startChapter: 4, endChapter: 5 }, newTestament: { book: '2 Corinthians', startChapter: 13, endChapter: 13 } },
    { day: 266, oldTestament: { book: 'Song of Solomon', startChapter: 6, endChapter: 8 }, newTestament: { book: 'Galatians', startChapter: 1, endChapter: 1 } },
    { day: 267, oldTestament: { book: 'Isaiah', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Galatians', startChapter: 2, endChapter: 2 } },
    { day: 268, oldTestament: { book: 'Isaiah', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Galatians', startChapter: 3, endChapter: 3 } },
    { day: 269, oldTestament: { book: 'Isaiah', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Galatians', startChapter: 4, endChapter: 4 } },
    { day: 270, oldTestament: { book: 'Isaiah', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Galatians', startChapter: 5, endChapter: 5 } },
    { day: 271, oldTestament: { book: 'Isaiah', startChapter: 13, endChapter: 15 }, newTestament: { book: 'Galatians', startChapter: 6, endChapter: 6 } },
    { day: 272, oldTestament: { book: 'Isaiah', startChapter: 16, endChapter: 18 }, newTestament: { book: 'Ephesians', startChapter: 1, endChapter: 1 } },
    { day: 273, oldTestament: { book: 'Isaiah', startChapter: 19, endChapter: 21 }, newTestament: { book: 'Ephesians', startChapter: 2, endChapter: 2 } },
    // October
    { day: 274, oldTestament: { book: 'Isaiah', startChapter: 22, endChapter: 23 }, newTestament: { book: 'Ephesians', startChapter: 3, endChapter: 3 } },
    { day: 275, oldTestament: { book: 'Isaiah', startChapter: 24, endChapter: 26 }, newTestament: { book: 'Ephesians', startChapter: 4, endChapter: 4 } },
    { day: 276, oldTestament: { book: 'Isaiah', startChapter: 27, endChapter: 28 }, newTestament: { book: 'Ephesians', startChapter: 5, endChapter: 5 } },
    { day: 277, oldTestament: { book: 'Isaiah', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Ephesians', startChapter: 6, endChapter: 6 } },
    { day: 278, oldTestament: { book: 'Isaiah', startChapter: 31, endChapter: 33 }, newTestament: { book: 'Philippians', startChapter: 1, endChapter: 1 } },
    { day: 279, oldTestament: { book: 'Isaiah', startChapter: 34, endChapter: 36 }, newTestament: { book: 'Philippians', startChapter: 2, endChapter: 2 } },
    { day: 280, oldTestament: { book: 'Isaiah', startChapter: 37, endChapter: 38 }, newTestament: { book: 'Philippians', startChapter: 3, endChapter: 3 } },
    { day: 281, oldTestament: { book: 'Isaiah', startChapter: 39, endChapter: 40 }, newTestament: { book: 'Philippians', startChapter: 4, endChapter: 4 } },
    { day: 282, oldTestament: { book: 'Isaiah', startChapter: 41, endChapter: 42 }, newTestament: { book: 'Colossians', startChapter: 1, endChapter: 1 } },
  { day: 283, oldTestament: { book: 'Isaiah', startChapter: 22, endChapter: 23 }, newTestament: { book: 'Ephesians', startChapter: 3, endChapter: 3 } }, // OCT 1
  { day: 284, oldTestament: { book: 'Isaiah', startChapter: 24, endChapter: 26 }, newTestament: { book: 'Ephesians', startChapter: 4, endChapter: 4 } }, // OCT 2
  { day: 285, oldTestament: { book: 'Isaiah', startChapter: 27, endChapter: 28 }, newTestament: { book: 'Ephesians', startChapter: 5, endChapter: 5 } }, // OCT 3
  { day: 286, oldTestament: { book: 'Isaiah', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Ephesians', startChapter: 6, endChapter: 6 } }, // OCT 4
  { day: 287, oldTestament: { book: 'Isaiah', startChapter: 31, endChapter: 33 }, newTestament: { book: 'Philippians', startChapter: 1, endChapter: 1 } }, // OCT 5
  { day: 288, oldTestament: { book: 'Isaiah', startChapter: 34, endChapter: 36 }, newTestament: { book: 'Philippians', startChapter: 2, endChapter: 2 } }, // OCT 6
  { day: 289, oldTestament: { book: 'Isaiah', startChapter: 37, endChapter: 38 }, newTestament: { book: 'Philippians', startChapter: 3, endChapter: 3 } }, // OCT 7
  { day: 290, oldTestament: { book: 'Isaiah', startChapter: 39, endChapter: 40 }, newTestament: { book: 'Philippians', startChapter: 4, endChapter: 4 } }, // OCT 8
  { day: 291, oldTestament: { book: 'Isaiah', startChapter: 41, endChapter: 42 }, newTestament: { book: 'Colossians', startChapter: 1, endChapter: 1 } }, // OCT 9
  { day: 292, oldTestament: { book: 'Isaiah', startChapter: 43, endChapter: 44 }, newTestament: { book: 'Colossians', startChapter: 2, endChapter: 2 } }, // OCT 10
  { day: 293, oldTestament: { book: 'Isaiah', startChapter: 45, endChapter: 47 }, newTestament: { book: 'Colossians', startChapter: 3, endChapter: 3 } }, // OCT 11
  { day: 294, oldTestament: { book: 'Isaiah', startChapter: 48, endChapter: 49 }, newTestament: { book: 'Colossians', startChapter: 4, endChapter: 4 } }, // OCT 12
  { day: 295, oldTestament: { book: 'Isaiah', startChapter: 50, endChapter: 52 }, newTestament: { book: '1 Thessalonians', startChapter: 1, endChapter: 1 } }, // OCT 13
  { day: 296, oldTestament: { book: 'Isaiah', startChapter: 53, endChapter: 55 }, newTestament: { book: '1 Thessalonians', startChapter: 2, endChapter: 2 } }, // OCT 14
  { day: 297, oldTestament: { book: 'Isaiah', startChapter: 56, endChapter: 58 }, newTestament: { book: '1 Thessalonians', startChapter: 3, endChapter: 3 } }, // OCT 15
  { day: 298, oldTestament: { book: 'Isaiah', startChapter: 59, endChapter: 61 }, newTestament: { book: '1 Thessalonians', startChapter: 4, endChapter: 4 } }, // OCT 16
  { day: 299, oldTestament: { book: 'Isaiah', startChapter: 62, endChapter: 64 }, newTestament: { book: '1 Thessalonians', startChapter: 5, endChapter: 5 } }, // OCT 17
  { day: 300, oldTestament: { book: 'Isaiah', startChapter: 65, endChapter: 66 }, newTestament: { book: '2 Thessalonians', startChapter: 1, endChapter: 1 } }, // OCT 18
  { day: 301, oldTestament: { book: 'Jeremiah', startChapter: 1, endChapter: 2 }, newTestament: { book: '2 Thessalonians', startChapter: 2, endChapter: 2 } }, // OCT 19
  { day: 302, oldTestament: { book: 'Jeremiah', startChapter: 3, endChapter: 4 }, newTestament: { book: '2 Thessalonians', startChapter: 3, endChapter: 3 } }, // OCT 20
  { day: 303, oldTestament: { book: 'Jeremiah', startChapter: 5, endChapter: 6 }, newTestament: { book: '1 Timothy', startChapter: 1, endChapter: 1 } }, // OCT 21
  { day: 304, oldTestament: { book: 'Jeremiah', startChapter: 7, endChapter: 8 }, newTestament: { book: '1 Timothy', startChapter: 2, endChapter: 2 } }, // OCT 22
  { day: 305, oldTestament: { book: 'Jeremiah', startChapter: 9, endChapter: 10 }, newTestament: { book: '1 Timothy', startChapter: 3, endChapter: 3 } }, // OCT 23
  { day: 306, oldTestament: { book: 'Jeremiah', startChapter: 11, endChapter: 13 }, newTestament: { book: '1 Timothy', startChapter: 4, endChapter: 4 } }, // OCT 24
  { day: 307, oldTestament: { book: 'Jeremiah', startChapter: 14, endChapter: 16 }, newTestament: { book: '1 Timothy', startChapter: 5, endChapter: 5 } }, // OCT 25
  { day: 308, oldTestament: { book: 'Jeremiah', startChapter: 17, endChapter: 19 }, newTestament: { book: '1 Timothy', startChapter: 6, endChapter: 6 } }, // OCT 26
  { day: 309, oldTestament: { book: 'Jeremiah', startChapter: 20, endChapter: 22 }, newTestament: { book: '2 Timothy', startChapter: 1, endChapter: 1 } }, // OCT 27
  { day: 310, oldTestament: { book: 'Jeremiah', startChapter: 23, endChapter: 24 }, newTestament: { book: '2 Timothy', startChapter: 2, endChapter: 2 } }, // OCT 28
  { day: 311, oldTestament: { book: 'Jeremiah', startChapter: 25, endChapter: 26 }, newTestament: { book: '2 Timothy', startChapter: 3, endChapter: 3 } }, // OCT 29
  { day: 312, oldTestament: { book: 'Jeremiah', startChapter: 27, endChapter: 28 }, newTestament: { book: '2 Timothy', startChapter: 4, endChapter: 4 } }, // OCT 30
  { day: 313, oldTestament: { book: 'Jeremiah', startChapter: 29, endChapter: 30 }, newTestament: { book: 'Titus', startChapter: 1, endChapter: 1 } }, // OCT 31
  { day: 314, oldTestament: { book: 'Jeremiah', startChapter: 31, endChapter: 32 }, newTestament: { book: 'Titus', startChapter: 2, endChapter: 2 } }, // NOV 1
  { day: 315, oldTestament: { book: 'Jeremiah', startChapter: 33, endChapter: 35 }, newTestament: { book: 'Titus', startChapter: 3, endChapter: 3 } }, // NOV 2
  { day: 316, oldTestament: { book: 'Jeremiah', startChapter: 36, endChapter: 37 }, newTestament: { book: 'Philemon', startChapter: 1, endChapter: 1 } }, // NOV 3
  { day: 317, oldTestament: { book: 'Jeremiah', startChapter: 38, endChapter: 39 }, newTestament: { book: 'Hebrews', startChapter: 1, endChapter: 1 } }, // NOV 4
  { day: 318, oldTestament: { book: 'Jeremiah', startChapter: 40, endChapter: 42 }, newTestament: { book: 'Hebrews', startChapter: 2, endChapter: 2 } }, // NOV 5
  { day: 319, oldTestament: { book: 'Jeremiah', startChapter: 43, endChapter: 45 }, newTestament: { book: 'Hebrews', startChapter: 3, endChapter: 3 } }, // NOV 6
  { day: 320, oldTestament: { book: 'Jeremiah', startChapter: 46, endChapter: 48 }, newTestament: { book: 'Hebrews', startChapter: 4, endChapter: 4 } }, // NOV 7
  { day: 321, oldTestament: { book: 'Jeremiah', startChapter: 49, endChapter: 50 }, newTestament: { book: 'Hebrews', startChapter: 5, endChapter: 5 } }, // NOV 8
  { day: 322, oldTestament: { book: 'Jeremiah', startChapter: 51, endChapter: 52 }, newTestament: { book: 'Hebrews', startChapter: 6, endChapter: 6 } }, // NOV 9
  { day: 323, oldTestament: { book: 'Lamentations', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Hebrews', startChapter: 7, endChapter: 7 } }, // NOV 10
  { day: 324, oldTestament: { book: 'Lamentations', startChapter: 3, endChapter: 5 }, newTestament: { book: 'Hebrews', startChapter: 8, endChapter: 8 } }, // NOV 11
  { day: 325, oldTestament: { book: 'Ezekiel', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Hebrews', startChapter: 9, endChapter: 9 } }, // NOV 12
  { day: 326, oldTestament: { book: 'Ezekiel', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Hebrews', startChapter: 10, startVerse: 1, endVerse: 23 } }, // NOV 13
  { day: 327, oldTestament: { book: 'Ezekiel', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Hebrews', startChapter: 10, startVerse: 24, endVerse: 39 } }, // NOV 14
  { day: 328, oldTestament: { book: 'Ezekiel', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Hebrews', startChapter: 11, startVerse: 1, endVerse: 19 } }, // NOV 15
  { day: 329, oldTestament: { book: 'Ezekiel', startChapter: 13, endChapter: 15 }, newTestament: { book: 'Hebrews', startChapter: 11, startVerse: 20, endVerse: 40 } }, // NOV 16
  { day: 330, oldTestament: { book: 'Ezekiel', startChapter: 16, endChapter: 16 }, newTestament: { book: 'Hebrews', startChapter: 12, endChapter: 12 } }, // NOV 17
  { day: 331, oldTestament: { book: 'Ezekiel', startChapter: 17, endChapter: 19 }, newTestament: { book: 'Hebrews', startChapter: 13, endChapter: 13 } }, // NOV 18
  { day: 332, oldTestament: { book: 'Ezekiel', startChapter: 20, endChapter: 21 }, newTestament: { book: 'James', startChapter: 1, endChapter: 1 } }, // NOV 19
  { day: 333, oldTestament: { book: 'Ezekiel', startChapter: 22, endChapter: 23 }, newTestament: { book: 'James', startChapter: 2, endChapter: 2 } }, // NOV 20
  { day: 334, oldTestament: { book: 'Ezekiel', startChapter: 24, endChapter: 26 }, newTestament: { book: 'James', startChapter: 3, endChapter: 3 } }, // NOV 21
  { day: 335, oldTestament: { book: 'Ezekiel', startChapter: 27, endChapter: 28 }, newTestament: { book: 'James', startChapter: 4, endChapter: 4 } }, // NOV 22
  { day: 336, oldTestament: { book: 'Ezekiel', startChapter: 29, endChapter: 31 }, newTestament: { book: 'James', startChapter: 5, endChapter: 5 } }, // NOV 23
  { day: 337, oldTestament: { book: 'Ezekiel', startChapter: 32, endChapter: 33 }, newTestament: { book: '1 Peter', startChapter: 1, endChapter: 1 } }, // NOV 24
  { day: 338, oldTestament: { book: 'Ezekiel', startChapter: 34, endChapter: 35 }, newTestament: { book: '1 Peter', startChapter: 2, endChapter: 2 } }, // NOV 25
  { day: 339, oldTestament: { book: 'Ezekiel', startChapter: 36, endChapter: 37 }, newTestament: { book: '1 Peter', startChapter: 3, endChapter: 3 } }, // NOV 26
  { day: 340, oldTestament: { book: 'Ezekiel', startChapter: 38, endChapter: 39 }, newTestament: { book: '1 Peter', startChapter: 4, endChapter: 4 } }, // NOV 27
  { day: 341, oldTestament: { book: 'Ezekiel', startChapter: 40, endChapter: 40 }, newTestament: { book: '1 Peter', startChapter: 5, endChapter: 5 } }, // NOV 28
  { day: 342, oldTestament: { book: 'Ezekiel', startChapter: 41, endChapter: 42 }, newTestament: { book: '2 Peter', startChapter: 1, endChapter: 1 } }, // NOV 29
  { day: 343, oldTestament: { book: 'Ezekiel', startChapter: 43, endChapter: 44 }, newTestament: { book: '2 Peter', startChapter: 2, endChapter: 2 } }, // NOV 30
  { day: 344, oldTestament: { book: 'Ezekiel', startChapter: 45, endChapter: 46 }, newTestament: { book: '2 Peter', startChapter: 3, endChapter: 3 } }, // DEC 1
  { day: 345, oldTestament: { book: 'Ezekiel', startChapter: 47, endChapter: 48 }, newTestament: { book: '1 John', startChapter: 1, endChapter: 1 } }, // DEC 2
  { day: 346, oldTestament: { book: 'Daniel', startChapter: 1, endChapter: 2 }, newTestament: { book: '1 John', startChapter: 2, endChapter: 2 } }, // DEC 3
  { day: 347, oldTestament: { book: 'Daniel', startChapter: 3, endChapter: 4 }, newTestament: { book: '1 John', startChapter: 3, endChapter: 3 } }, // DEC 4
  { day: 348, oldTestament: { book: 'Daniel', startChapter: 5, endChapter: 6 }, newTestament: { book: '1 John', startChapter: 4, endChapter: 4 } }, // DEC 5
  { day: 349, oldTestament: { book: 'Daniel', startChapter: 7, endChapter: 8 }, newTestament: { book: '1 John', startChapter: 5, endChapter: 5 } }, // DEC 6
  { day: 350, oldTestament: { book: 'Daniel', startChapter: 9, endChapter: 10 }, newTestament: { book: '2 John', startChapter: 1, endChapter: 1 } }, // DEC 7
  { day: 351, oldTestament: { book: 'Daniel', startChapter: 11, endChapter: 12 }, newTestament: { book: '3 John', startChapter: 1, endChapter: 1 } }, // DEC 8
  { day: 352, oldTestament: { book: 'Hosea', startChapter: 1, endChapter: 4 }, newTestament: { book: 'Jude', startChapter: 1, endChapter: 1 } }, // DEC 9
  { day: 353, oldTestament: { book: 'Hosea', startChapter: 5, endChapter: 8 }, newTestament: { book: 'Revelation', startChapter: 1, endChapter: 1 } }, // DEC 10
  { day: 354, oldTestament: { book: 'Hosea', startChapter: 9, endChapter: 11 }, newTestament: { book: 'Revelation', startChapter: 2, endChapter: 2 } }, // DEC 11
  { day: 355, oldTestament: { book: 'Hosea', startChapter: 12, endChapter: 14 }, newTestament: { book: 'Revelation', startChapter: 3, endChapter: 3 } }, // DEC 12
  { day: 356, oldTestament: { book: 'Joel', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 4, endChapter: 4 } }, // DEC 13
  { day: 357, oldTestament: { book: 'Amos', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 5, endChapter: 5 } }, // DEC 14
  { day: 358, oldTestament: { book: 'Amos', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Revelation', startChapter: 6, endChapter: 6 } }, // DEC 15
  { day: 359, oldTestament: { book: 'Amos', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Revelation', startChapter: 7, endChapter: 7 } }, // DEC 16
  { day: 360, oldTestament: { book: 'Obadiah', startChapter: 1, endChapter: 1 }, newTestament: { book: 'Revelation', startChapter: 8, endChapter: 8 } }, // DEC 17
  { day: 361, oldTestament: { book: 'Jonah', startChapter: 1, endChapter: 4 }, newTestament: { book: 'Revelation', startChapter: 9, endChapter: 9 } }, // DEC 18
  { day: 362, oldTestament: { book: 'Micah', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 10, endChapter: 10 } }, // DEC 19
  { day: 363, oldTestament: { book: 'Micah', startChapter: 4, endChapter: 5 }, newTestament: { book: 'Revelation', startChapter: 11, endChapter: 11 } }, // DEC 20
  { day: 364, oldTestament: { book: 'Micah', startChapter: 6, endChapter: 7 }, newTestament: { book: 'Revelation', startChapter: 12, endChapter: 12 } }, // DEC 21
  { day: 365, oldTestament: { book: 'Nahum', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 13, endChapter: 13 } }, // DEC 22
  { day: 366, oldTestament: { book: 'Habakkuk', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 14, endChapter: 14 } }, // DEC 23
  { day: 367, oldTestament: { book: 'Zephaniah', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 15, endChapter: 15 } }, // DEC 24
  { day: 368, oldTestament: { book: 'Haggai', startChapter: 1, endChapter: 2 }, newTestament: { book: 'Revelation', startChapter: 16, endChapter: 16 } }, // DEC 25
  { day: 369, oldTestament: { book: 'Zechariah', startChapter: 1, endChapter: 3 }, newTestament: { book: 'Revelation', startChapter: 17, endChapter: 17 } }, // DEC 26
  { day: 370, oldTestament: { book: 'Zechariah', startChapter: 4, endChapter: 6 }, newTestament: { book: 'Revelation', startChapter: 18, endChapter: 18 } }, // DEC 27
  { day: 371, oldTestament: { book: 'Zechariah', startChapter: 7, endChapter: 9 }, newTestament: { book: 'Revelation', startChapter: 19, endChapter: 19 } }, // DEC 28
  { day: 372, oldTestament: { book: 'Zechariah', startChapter: 10, endChapter: 12 }, newTestament: { book: 'Revelation', startChapter: 20, endChapter: 20 } }, // DEC 29
  { day: 373, oldTestament: { book: 'Zechariah', startChapter: 13, endChapter: 14 }, newTestament: { book: 'Revelation', startChapter: 21, endChapter: 21 } }, // DEC 30
  { day: 374, oldTestament: { book: 'Malachi', startChapter: 1, endChapter: 4 }, newTestament: { book: 'Revelation', startChapter: 22, endChapter: 22 } }
]


module.exports = READING_PLAN_DATA;