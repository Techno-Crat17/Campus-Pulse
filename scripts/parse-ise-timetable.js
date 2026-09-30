// Verification & generator script for ISE faculty schedules from official timetable
import fs from 'fs';

export const FACULTY_CODE_MAP = {
  'SM': 'Sumana',
  'SKS': 'Savita K',
  'YHK': 'Yogish',
  'PMK': 'Krishna Raj',
  'GV': 'Geetha V',
  'LMM': 'Lincy',
  'PMN': 'Pushpalatha',
  'SRM': 'Mani Sekhar',
  'AP': 'Anitha P',
  'DJS': 'Jagadeesh',
  'PRA': 'Pra',
  'SKR': 'Suresh Kumar',
  'SG': 'Shruti G',
  'SJR': 'Jr Shruti',
  'ED': 'Evangeline D',
  'DM': 'Mushtaq',
  'KS': 'Kusuma',
  'SS': 'Shivanand',
  'KKS': 'Kavya',
  'CV': 'Charunayana',
  'SP': 'Shanmuga Priya',
  'SB': 'Subia Salma',
  'SK': 'Sudha Kamshetty',
  'ZT': 'Zeenat',
  'PSR': 'Pratima'
};

// Raw Timetable Entries per day
// Time slots:
// '09:00–09:55', '09:55–10:50', '11:05–12:00', '12:00–12:55', '13:45–14:40', '14:40–15:35', '15:35–16:30'
// Labs spanning 2 periods:
// '09:00–10:50' -> breaks down into '09:00–09:55' & '09:55–10:50' OR keeps '09:00–10:50' (or standard slots)
// Let's check prompt requirement 1 & 2:
// Time slots format: "09:00–09:55", "09:55–10:50", "11:05–12:00", "12:00–12:55", "13:45–14:40", "14:40–15:35", "15:35–16:30"
// Example in prompt:
// MONDAY
// 09:55–10:50
// DCO
// 11:05–12:00
// OOP
// 13:45–14:40
// CC
// 14:40–15:35
// CC

export const RAW_TIMETABLE = {
  Monday: [
    // MTech I
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'] },
    { time: '11:05–12:00', subject: 'AI', codes: ['YHK'] },
    { time: '13:45–14:40', subject: 'CC', codes: ['DJS'] },
    { time: '14:40–15:35', subject: 'CC', codes: ['DJS'] },
    // MTech III
    { time: '09:00–09:55', subject: 'NPTEL2', codes: ['PMN'] },
    { time: '11:05–12:00', subject: 'NPTEL1', codes: ['SKS'] },
    // I Q
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SJR'] },
    // I E
    { time: '13:45–14:40', subject: 'Prg in C', codes: ['LMM'] },
    // I U
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SS'] },
    // I V
    { time: '11:05–12:00', subject: 'Intro C', codes: ['SP'] },
    // III A
    { time: '09:00–09:55', subject: 'DCO', codes: ['YHK'] },
    { time: '09:55–10:50', subject: 'OOP', codes: ['SM'] },
    { time: '12:00–12:55', subject: 'DS', codes: ['KS'] },
    { time: '13:45–14:40', subject: 'OOP LAB2', codes: ['SM', 'ED', 'SP', 'ZT', 'SJR'] },
    { time: '14:40–15:35', subject: 'OOP LAB2', codes: ['SM', 'ED', 'SP', 'ZT', 'SJR'] },
    // III B
    { time: '11:05–12:00', subject: 'DS LAB2', codes: ['DM', 'PMN', 'SG'] },
    { time: '12:00–12:55', subject: 'DS LAB2', codes: ['DM', 'PMN', 'SG'] },
    { time: '13:45–14:40', subject: 'DMS', codes: ['PSR'] },
    { time: '14:40–15:35', subject: 'DCO', codes: ['SKS'] },
    // III C
    { time: '09:00–09:55', subject: 'DCO', codes: ['AP'] },
    { time: '09:55–10:50', subject: 'DMS', codes: ['CV'] },
    { time: '11:05–12:00', subject: 'MATHS', codes: ['SS'] },
    { time: '12:00–12:55', subject: 'DS', codes: ['LMM'] },
    // V A
    { time: '09:00–09:55', subject: 'ML LAB1', codes: ['KKS', 'ZT', 'PRA', 'DJS'] },
    { time: '09:55–10:50', subject: 'ML LAB1', codes: ['KKS', 'ZT', 'PRA', 'DJS'] },
    { time: '11:05–12:00', subject: 'SE', codes: ['SB'] },
    { time: '12:00–12:55', subject: 'CN', codes: ['CV'] },
    { time: '13:45–14:40', subject: 'RMIPR', codes: ['AP'] },
    { time: '14:40–15:35', subject: 'ML', codes: ['KKS'] },
    // V B
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['GV'] },
    { time: '09:55–10:50', subject: 'CN', codes: ['SKR'] },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'] },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SS'] },
    { time: '13:45–14:40', subject: 'SE LAB3', codes: ['DM', 'SB', 'SK'] },
    { time: '14:40–15:35', subject: 'SE LAB3', codes: ['DM', 'SB', 'SK'] },
    { time: '15:35–16:30', subject: 'EVS', codes: ['SG', 'LMM', 'GV'] },
    // V C
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['PMK'] },
    { time: '09:55–10:50', subject: 'ML', codes: ['SG'] },
    { time: '11:05–12:00', subject: 'TOC Tut', codes: ['SJR', 'SRM', 'ZT'] },
    { time: '12:00–12:55', subject: 'TOC Tut', codes: ['SJR', 'SRM', 'ZT'] },
    { time: '13:45–14:40', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'] },
    { time: '14:40–15:35', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'] },
    // VII A
    { time: '09:00–09:55', subject: 'DC LAB3', codes: ['PSR', 'SB', 'ED'] },
    { time: '09:55–10:50', subject: 'DC LAB3', codes: ['PSR', 'SB', 'ED'] },
    { time: '11:05–12:00', subject: 'IS', codes: ['GV'] },
    { time: '12:00–12:55', subject: 'ST', codes: ['KKS'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'] },
    // VII B
    { time: '09:00–09:55', subject: 'BD LAB2', codes: ['SP', 'KS', 'LMM'] },
    { time: '09:55–10:50', subject: 'BD LAB2', codes: ['SP', 'KS', 'LMM'] },
    { time: '11:05–12:00', subject: 'IS', codes: ['ED'] },
    { time: '12:00–12:55', subject: 'DC', codes: ['SK'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'] }
  ],

  Tuesday: [
    // MTech I
    { time: '09:00–09:55', subject: 'SDS', codes: ['PMK'] },
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'] },
    { time: '11:05–12:00', subject: 'CC', codes: ['DJS'] },
    // MTech III
    { time: '13:45–14:40', subject: 'NPTEL1', codes: ['SKS'] },
    { time: '14:40–15:35', subject: 'NPTEL2', codes: ['PMN'] },
    // I Q
    { time: '11:05–12:00', subject: 'Intro C Lab1', codes: ['SJR', 'PSR', 'AP', 'SK'] },
    { time: '12:00–12:55', subject: 'Intro C Lab1', codes: ['SJR', 'PSR', 'AP', 'SK'] },
    // I D
    { time: '11:05–12:00', subject: 'IDT Lab2', codes: ['YHK', 'PRA', 'SKR'] },
    { time: '12:00–12:55', subject: 'IDT Lab2', codes: ['YHK', 'PRA', 'SKR'] },
    // I U
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SS'] },
    // I V
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SP'] },
    // III A
    { time: '09:55–10:50', subject: 'DMS', codes: ['PRA'] },
    { time: '11:05–12:00', subject: 'DCO', codes: ['YHK'] },
    { time: '12:00–12:55', subject: 'OOP', codes: ['SM'] },
    { time: '14:40–15:35', subject: 'UHV', codes: ['KKS'] },
    // III B
    { time: '09:00–09:55', subject: 'DMS', codes: ['PSR'] },
    { time: '09:55–10:50', subject: 'DS', codes: ['DM'] },
    { time: '11:05–12:00', subject: 'DCO LAB3', codes: ['SKS', 'KS', 'SG'] },
    { time: '12:00–12:55', subject: 'DCO LAB3', codes: ['SKS', 'KS', 'SG'] },
    { time: '14:40–15:35', subject: 'UHV', codes: ['DM'] },
    // III C
    { time: '09:00–09:55', subject: 'DS', codes: ['LMM'] },
    { time: '09:55–10:50', subject: 'DMS', codes: ['CV'] },
    { time: '11:05–12:00', subject: 'OOP LAB1', codes: ['SP', 'PMN', 'ZT'] },
    { time: '12:00–12:55', subject: 'OOP LAB1', codes: ['SP', 'PMN', 'ZT'] },
    { time: '13:45–14:40', subject: 'DS', codes: ['LMM'] },
    // V A
    { time: '09:00–09:55', subject: 'TOC Tut', codes: ['SRM', 'SJR', 'ZT'] },
    { time: '09:55–10:50', subject: 'TOC Tut', codes: ['SRM', 'SJR', 'ZT'] },
    { time: '11:05–12:00', subject: 'RMIPR', codes: ['AP'] },
    { time: '12:00–12:55', subject: 'ML', codes: ['KKS'] },
    { time: '13:45–14:40', subject: 'CN', codes: ['CV'] },
    { time: '14:40–15:35', subject: 'SE', codes: ['SB'] },
    // V B
    { time: '09:00–09:55', subject: 'CN', codes: ['SKR'] },
    { time: '09:55–10:50', subject: 'ML', codes: ['SM'] },
    { time: '11:05–12:00', subject: 'TOC Tut', codes: ['SS', 'DM', 'SK'] },
    { time: '12:00–12:55', subject: 'TOC Tut', codes: ['SS', 'DM', 'SK'] },
    { time: '13:45–14:40', subject: 'ML LAB3', codes: ['SG', 'GV', 'SKS', 'ZT'] },
    { time: '14:40–15:35', subject: 'ML LAB3', codes: ['SG', 'GV', 'SKS', 'ZT'] },
    // V C
    { time: '09:00–09:55', subject: 'ML LAB2', codes: ['SG', 'KS', 'KKS'] },
    { time: '09:55–10:50', subject: 'ML LAB2', codes: ['SG', 'KS', 'KKS'] },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'] },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['PMK'] },
    // VII A
    { time: '09:00–09:55', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'SS'] },
    { time: '09:55–10:50', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'SS'] },
    { time: '11:05–12:00', subject: 'DC', codes: ['PSR'] },
    { time: '12:00–12:55', subject: 'IS', codes: ['GV'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'] },
    // VII B
    { time: '09:00–09:55', subject: 'DC', codes: ['SK'] },
    { time: '09:55–10:50', subject: 'ST', codes: ['PMN'] },
    { time: '11:05–12:00', subject: 'GEN AI LAB2', codes: ['SB', 'ED', 'CV'] },
    { time: '12:00–12:55', subject: 'GEN AI LAB2', codes: ['SB', 'ED', 'CV'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'] },
    { time: '14:40–15:35', subject: 'IS', codes: ['ED'] }
  ],

  Wednesday: [
    // MTech I
    { time: '09:00–09:55', subject: 'DV LAB', codes: ['PMK', 'SRM'] },
    { time: '09:55–10:50', subject: 'DV LAB', codes: ['PMK', 'SRM'] },
    { time: '11:05–12:00', subject: 'AI', codes: ['YHK'] },
    // I Q
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SJR'] },
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'] },
    // I E
    { time: '09:00–09:55', subject: 'C Prg LAB2', codes: ['LMM', 'KKS', 'SG', 'GV', 'ZT'] },
    { time: '09:55–10:50', subject: 'C Prg LAB2', codes: ['LMM', 'KKS', 'SG', 'GV', 'ZT'] },
    { time: '13:45–14:40', subject: 'IDT lab1', codes: ['SKR', 'PRA', 'GV'] },
    { time: '14:40–15:35', subject: 'IDT lab1', codes: ['SKR', 'PRA', 'GV'] },
    // I U
    { time: '11:05–12:00', subject: 'Intro C Lab2', codes: ['SS', 'DM', 'KKS', 'ZT'] },
    { time: '12:00–12:55', subject: 'Intro C Lab2', codes: ['SS', 'DM', 'KKS', 'ZT'] },
    // I V
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SP'] },
    // III A
    { time: '09:55–10:50', subject: 'DS', codes: ['KS'] },
    { time: '11:05–12:00', subject: 'DMS', codes: ['PRA'] },
    { time: '13:45–14:40', subject: 'DCO LAB3', codes: ['YHK', 'PSR', 'SP'] },
    { time: '14:40–15:35', subject: 'DCO LAB3', codes: ['YHK', 'PSR', 'SP'] },
    // III B
    { time: '09:55–10:50', subject: 'DMS', codes: ['PSR'] },
    { time: '11:05–12:00', subject: 'DS', codes: ['DM'] },
    { time: '12:00–12:55', subject: 'DCO', codes: ['SKS'] },
    { time: '13:45–14:40', subject: 'OOP', codes: ['ED'] },
    // III C
    { time: '09:00–09:55', subject: 'OOP', codes: ['SP'] },
    { time: '09:55–10:50', subject: 'DCO', codes: ['AP'] },
    { time: '11:05–12:00', subject: 'DS LAB2', codes: ['LMM', 'KS', 'SK'] },
    { time: '12:00–12:55', subject: 'DS LAB2', codes: ['LMM', 'KS', 'SK'] },
    { time: '13:45–14:40', subject: 'MATHS', codes: ['SS'] },
    { time: '14:40–15:35', subject: 'DMS', codes: ['CV'] },
    // V A
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '09:55–10:50', subject: 'CN', codes: ['CV'] },
    { time: '11:05–12:00', subject: 'SE LAB3', codes: ['SB', 'AP', 'DJS', 'CV'] },
    { time: '12:00–12:55', subject: 'SE LAB3', codes: ['SB', 'AP', 'DJS', 'CV'] },
    // V B
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '09:55–10:50', subject: 'ML', codes: ['SM'] },
    { time: '11:05–12:00', subject: 'TOC', codes: ['SS'] },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['GV'] },
    // V C
    { time: '09:55–10:50', subject: 'CN', codes: ['SKR'] },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'] },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SJR'] },
    { time: '13:45–14:40', subject: 'RMIPR', codes: ['PMK'] },
    { time: '14:40–15:35', subject: 'SE', codes: ['PMN'] },
    // VII A
    { time: '09:00–09:55', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'PMN'] },
    { time: '09:55–10:50', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'PMN'] },
    { time: '11:05–12:00', subject: 'ST', codes: ['KKS'] },
    { time: '12:00–12:55', subject: 'DC', codes: ['PSR'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'] },
    // VII B
    { time: '09:00–09:55', subject: 'DC LAB3', codes: ['SK', 'SS', 'DM'] },
    { time: '09:55–10:50', subject: 'DC LAB3', codes: ['SK', 'SS', 'DM'] },
    { time: '11:05–12:00', subject: 'ST', codes: ['PMN'] },
    { time: '12:00–12:55', subject: 'IS', codes: ['ED'] },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'] }
  ],

  Thursday: [
    // MTech I
    { time: '09:55–10:50', subject: 'SDS', codes: ['PMK'] },
    { time: '11:05–12:00', subject: 'SDS', codes: ['PMK'] },
    { time: '12:00–12:55', subject: 'DM', codes: ['SKS'] },
    { time: '13:45–14:40', subject: 'BD LAB', codes: ['SP', 'PSR'] },
    { time: '14:40–15:35', subject: 'BD LAB', codes: ['SP', 'PSR'] },
    // I Q
    { time: '11:05–12:00', subject: 'Intro C', codes: ['SJR'] },
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'] },
    // I E
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['LMM'] },
    // III A
    { time: '11:05–12:00', subject: 'OOP', codes: ['SM'] },
    { time: '12:00–12:55', subject: 'DMS', codes: ['PRA'] },
    { time: '13:45–14:40', subject: 'DS LAB2', codes: ['KS', 'SK', 'ZT'] },
    { time: '14:40–15:35', subject: 'DS LAB2', codes: ['KS', 'SK', 'ZT'] },
    // III B
    { time: '09:55–10:50', subject: 'OOP', codes: ['ED'] },
    { time: '11:05–12:00', subject: 'OOP LAB1', codes: ['ED', 'ZT', 'DJS', 'CV'] },
    { time: '12:00–12:55', subject: 'OOP LAB1', codes: ['ED', 'ZT', 'DJS', 'CV'] },
    { time: '13:45–14:40', subject: 'DCO', codes: ['SKS'] },
    // III C
    { time: '11:05–12:00', subject: 'OOP', codes: ['SP'] },
    { time: '12:00–12:55', subject: 'DCO', codes: ['AP'] },
    { time: '13:45–14:40', subject: 'DCO LAB3', codes: ['AP', 'SB', 'PMN'] },
    { time: '14:40–15:35', subject: 'DCO LAB3', codes: ['AP', 'SB', 'PMN'] },
    // V A
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['AP'] },
    { time: '09:55–10:50', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '11:05–12:00', subject: 'TOC', codes: ['SRM'] },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SRM'] },
    { time: '13:45–14:40', subject: 'CN', codes: ['CV'] },
    { time: '14:40–15:35', subject: 'ML', codes: ['KKS'] },
    // V B
    { time: '09:00–09:55', subject: 'SE', codes: ['DM'] },
    { time: '09:55–10:50', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '11:05–12:00', subject: 'SE', codes: ['DM'] },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['GV'] },
    { time: '13:45–14:40', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'] },
    { time: '14:40–15:35', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'] },
    // V C
    { time: '09:00–09:55', subject: 'TOC', codes: ['SJR'] },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'] },
    { time: '12:00–12:55', subject: 'SE', codes: ['PMN'] },
    { time: '13:45–14:40', subject: 'ML', codes: ['SG'] },
    { time: '14:40–15:35', subject: 'ML', codes: ['SG'] },
    // VII A
    { time: '09:00–09:55', subject: 'BD LAB2', codes: ['SKS', 'LMM', 'PSR'] },
    { time: '09:55–10:50', subject: 'BD LAB2', codes: ['SKS', 'LMM', 'PSR'] },
    { time: '11:05–12:00', subject: 'DC', codes: ['PSR'] },
    { time: '12:00–12:55', subject: 'ST', codes: ['KKS'] },
    { time: '13:45–14:40', subject: 'IS', codes: ['GV'] },
    // VII B
    { time: '09:00–09:55', subject: 'ST', codes: ['PMN'] },
    { time: '09:55–10:50', subject: 'DC', codes: ['SK'] },
    { time: '11:05–12:00', subject: 'GEN AI LAB2', codes: ['SB', 'SS', 'KS'] },
    { time: '12:00–12:55', subject: 'GEN AI LAB2', codes: ['SB', 'SS', 'KS'] }
  ],

  Friday: [
    // MTech I
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'] },
    { time: '11:05–12:00', subject: 'SDS', codes: ['PMK'] },
    { time: '12:00–12:55', subject: 'AI', codes: ['YHK'] },
    // I D
    { time: '09:00–09:55', subject: 'C Prg LAB2', codes: ['SG', 'SK', 'ZT', 'CV', 'PSR'] },
    { time: '09:55–10:50', subject: 'C Prg LAB2', codes: ['SG', 'SK', 'ZT', 'CV', 'PSR'] },
    // I E
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['LMM'] },
    // I U
    { time: '09:00–09:55', subject: 'Intro C', codes: ['SS'] },
    // III A
    { time: '09:00–09:55', subject: 'DS', codes: ['KS'] },
    { time: '09:55–10:50', subject: 'DCO', codes: ['YHK'] },
    { time: '11:05–12:00', subject: 'UHV', codes: ['KKS'] },
    { time: '12:00–12:55', subject: 'EE', codes: ['DJS'] },
    // III B
    { time: '09:00–09:55', subject: 'DS', codes: ['DM'] },
    { time: '09:55–10:50', subject: 'OOP', codes: ['ED'] },
    { time: '11:05–12:00', subject: 'UHV', codes: ['DM'] },
    { time: '12:00–12:55', subject: 'EE', codes: ['SK'] },
    // III C
    { time: '09:00–09:55', subject: 'MATHS', codes: ['SS'] },
    { time: '09:55–10:50', subject: 'OOP', codes: ['SP'] },
    { time: '12:00–12:55', subject: 'G-IT', codes: ['PRA'] },
    // V A
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'] },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'] },
    { time: '11:05–12:00', subject: 'CN LAB1', codes: ['CV', 'SJR', 'SRM'] },
    { time: '12:00–12:55', subject: 'CN LAB1', codes: ['CV', 'SJR', 'SRM'] },
    // V B
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'] },
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'] },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'] },
    { time: '11:05–12:00', subject: 'ML', codes: ['SM'] },
    { time: '12:00–12:55', subject: 'CN', codes: ['SKR'] },
    // V C
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'] },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'] },
    { time: '11:05–12:00', subject: 'SE LAB3', codes: ['PMN', 'SB', 'GV'] },
    { time: '12:00–12:55', subject: 'SE LAB3', codes: ['PMN', 'SB', 'GV'] }
  ],

  Saturday: [
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'] },
    // I V
    { time: '09:00–09:55', subject: 'Intro C Lab1', codes: ['SP', 'SJR', 'SB', 'SK', 'ZT'] },
    { time: '09:55–10:50', subject: 'Intro C Lab1', codes: ['SP', 'SJR', 'SB', 'SK', 'ZT'] }
  ]
};

// Build map of facultyName -> { Monday: [...], Tuesday: [...], ... }
export function buildFacultySchedules() {
  const result = {};

  for (const [code, name] of Object.entries(FACULTY_CODE_MAP)) {
    result[name] = {
      code,
      name,
      schedule: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: []
      }
    };
  }

  for (const [day, entries] of Object.entries(RAW_TIMETABLE)) {
    for (const entry of entries) {
      for (const code of entry.codes) {
        const facName = FACULTY_CODE_MAP[code];
        if (!facName) continue;

        // Check if entry already added for this time to avoid duplicate
        const existing = result[facName].schedule[day].find(e => e.time === entry.time);
        if (!existing) {
          result[facName].schedule[day].push({
            time: entry.time,
            subject: entry.subject
          });
        }
      }
    }
  }

  // Sort by start time
  const timeOrder = [
    '09:00–09:55',
    '09:55–10:50',
    '11:05–12:00',
    '12:00–12:55',
    '13:45–14:40',
    '14:40–15:35',
    '15:35–16:30'
  ];

  for (const facName of Object.keys(result)) {
    for (const day of Object.keys(result[facName].schedule)) {
      result[facName].schedule[day].sort((a, b) => {
        return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
      });
    }
  }

  return result;
}
