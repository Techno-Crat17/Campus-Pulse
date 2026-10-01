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

export const RAW_TIMETABLE = {
  Monday: [
    // MTech I
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'], room: 'DES-106' },
    { time: '11:05–12:00', subject: 'AI', codes: ['YHK'], room: 'DES-106' },
    { time: '13:45–14:40', subject: 'CC', codes: ['DJS'], room: 'DES-106' },
    { time: '14:40–15:35', subject: 'CC', codes: ['DJS'], room: 'DES-106' },
    // MTech III
    { time: '09:00–09:55', subject: 'NPTEL2', codes: ['PMN'], room: 'DES-105' },
    { time: '11:05–12:00', subject: 'NPTEL1', codes: ['SKS'], room: 'DES-105' },
    // I Q
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SJR'], room: 'LHC-204' },
    // I E
    { time: '13:45–14:40', subject: 'Prg in C', codes: ['LMM'], room: 'LHC-206' },
    // I U
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SS'], room: 'LHC-208' },
    // I V
    { time: '11:05–12:00', subject: 'Intro C', codes: ['SP'], room: 'LHC-210' },
    // III A
    { time: '09:00–09:55', subject: 'DCO', codes: ['YHK'], room: 'Room-101' },
    { time: '09:55–10:50', subject: 'OOP', codes: ['SM'], room: 'Room-101' },
    { time: '12:00–12:55', subject: 'DS', codes: ['KS'], room: 'Room-101' },
    { time: '13:45–14:40', subject: 'OOP LAB2', codes: ['SM', 'ED', 'SP', 'ZT', 'SJR'], room: 'DES-308' },
    { time: '14:40–15:35', subject: 'OOP LAB2', codes: ['SM', 'ED', 'SP', 'ZT', 'SJR'], room: 'DES-308' },
    // III B
    { time: '11:05–12:00', subject: 'DS LAB2', codes: ['DM', 'PMN', 'SG'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'DS LAB2', codes: ['DM', 'PMN', 'SG'], room: 'DES-308' },
    { time: '13:45–14:40', subject: 'DMS', codes: ['PSR'], room: 'Room-102' },
    { time: '14:40–15:35', subject: 'DCO', codes: ['SKS'], room: 'Room-102' },
    // III C
    { time: '09:00–09:55', subject: 'DCO', codes: ['AP'], room: 'LHC-204' },
    { time: '09:55–10:50', subject: 'DMS', codes: ['CV'], room: 'LHC-204' },
    { time: '11:05–12:00', subject: 'MATHS', codes: ['SS'], room: 'LHC-204' },
    { time: '12:00–12:55', subject: 'DS', codes: ['LMM'], room: 'LHC-204' },
    // V A
    { time: '09:00–09:55', subject: 'ML LAB1', codes: ['KKS', 'ZT', 'PRA', 'DJS'], room: 'DES-207' },
    { time: '09:55–10:50', subject: 'ML LAB1', codes: ['KKS', 'ZT', 'PRA', 'DJS'], room: 'DES-207' },
    { time: '11:05–12:00', subject: 'SE', codes: ['SB'], room: 'LHC-208' },
    { time: '12:00–12:55', subject: 'CN', codes: ['CV'], room: 'LHC-208' },
    { time: '13:45–14:40', subject: 'RMIPR', codes: ['AP'], room: 'LHC-208' },
    { time: '14:40–15:35', subject: 'ML', codes: ['KKS'], room: 'LHC-208' },
    // V B
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['GV'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'CN', codes: ['SKR'], room: 'LHC-210' },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'], room: 'LHC-210' },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SS'], room: 'LHC-210' },
    { time: '13:45–14:40', subject: 'SE LAB3', codes: ['DM', 'SB', 'SK'], room: 'DES-208' },
    { time: '14:40–15:35', subject: 'SE LAB3', codes: ['DM', 'SB', 'SK'], room: 'DES-208' },
    { time: '15:35–16:30', subject: 'EVS', codes: ['SG', 'LMM', 'GV'], room: 'LHC-210' },
    // V C
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['PMK'], room: 'LHC-212' },
    { time: '09:55–10:50', subject: 'ML', codes: ['SG'], room: 'LHC-212' },
    { time: '11:05–12:00', subject: 'TOC Tut', codes: ['SJR', 'SRM', 'ZT'], room: 'LHC-212' },
    { time: '12:00–12:55', subject: 'TOC Tut', codes: ['SJR', 'SRM', 'ZT'], room: 'LHC-212' },
    { time: '13:45–14:40', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'], room: 'DES-207' },
    { time: '14:40–15:35', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'], room: 'DES-207' },
    // VII A
    { time: '09:00–09:55', subject: 'DC LAB3', codes: ['PSR', 'SB', 'ED'], room: 'DES-208' },
    { time: '09:55–10:50', subject: 'DC LAB3', codes: ['PSR', 'SB', 'ED'], room: 'DES-208' },
    { time: '11:05–12:00', subject: 'IS', codes: ['GV'], room: 'LHC-301' },
    { time: '12:00–12:55', subject: 'ST', codes: ['KKS'], room: 'LHC-301' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'], room: 'LHC-301' },
    // VII B
    { time: '09:00–09:55', subject: 'BD LAB2', codes: ['SP', 'KS', 'LMM'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'BD LAB2', codes: ['SP', 'KS', 'LMM'], room: 'DES-308' },
    { time: '11:05–12:00', subject: 'IS', codes: ['ED'], room: 'LHC-302' },
    { time: '12:00–12:55', subject: 'DC', codes: ['SK'], room: 'LHC-302' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'], room: 'LHC-302' }
  ],

  Tuesday: [
    // MTech I
    { time: '09:00–09:55', subject: 'SDS', codes: ['PMK'], room: 'DES-106' },
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'], room: 'DES-106' },
    { time: '11:05–12:00', subject: 'CC', codes: ['DJS'], room: 'DES-106' },
    // MTech III
    { time: '13:45–14:40', subject: 'NPTEL1', codes: ['SKS'], room: 'DES-105' },
    { time: '14:40–15:35', subject: 'NPTEL2', codes: ['PMN'], room: 'DES-105' },
    // I Q
    { time: '11:05–12:00', subject: 'Intro C Lab1', codes: ['SJR', 'PSR', 'AP', 'SK'], room: 'DES-207' },
    { time: '12:00–12:55', subject: 'Intro C Lab1', codes: ['SJR', 'PSR', 'AP', 'SK'], room: 'DES-207' },
    // I D
    { time: '11:05–12:00', subject: 'IDT Lab2', codes: ['YHK', 'PRA', 'SKR'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'IDT Lab2', codes: ['YHK', 'PRA', 'SKR'], room: 'DES-308' },
    // I U
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SS'], room: 'LHC-208' },
    // I V
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SP'], room: 'LHC-210' },
    // III A
    { time: '09:55–10:50', subject: 'DMS', codes: ['PRA'], room: 'Room-101' },
    { time: '11:05–12:00', subject: 'DCO', codes: ['YHK'], room: 'Room-101' },
    { time: '12:00–12:55', subject: 'OOP', codes: ['SM'], room: 'Room-101' },
    { time: '14:40–15:35', subject: 'UHV', codes: ['KKS'], room: 'Room-101' },
    // III B
    { time: '09:00–09:55', subject: 'DMS', codes: ['PSR'], room: 'Room-102' },
    { time: '09:55–10:50', subject: 'DS', codes: ['DM'], room: 'Room-102' },
    { time: '11:05–12:00', subject: 'DCO LAB3', codes: ['SKS', 'KS', 'SG'], room: 'DES-208' },
    { time: '12:00–12:55', subject: 'DCO LAB3', codes: ['SKS', 'KS', 'SG'], room: 'DES-208' },
    { time: '14:40–15:35', subject: 'UHV', codes: ['DM'], room: 'Room-102' },
    // III C
    { time: '09:00–09:55', subject: 'DS', codes: ['LMM'], room: 'LHC-204' },
    { time: '09:55–10:50', subject: 'DMS', codes: ['CV'], room: 'LHC-204' },
    { time: '11:05–12:00', subject: 'OOP LAB1', codes: ['SP', 'PMN', 'ZT'], room: 'DES-207' },
    { time: '12:00–12:55', subject: 'OOP LAB1', codes: ['SP', 'PMN', 'ZT'], room: 'DES-207' },
    { time: '13:45–14:40', subject: 'DS', codes: ['LMM'], room: 'LHC-204' },
    // V A
    { time: '09:00–09:55', subject: 'TOC Tut', codes: ['SRM', 'SJR', 'ZT'], room: 'LHC-208' },
    { time: '09:55–10:50', subject: 'TOC Tut', codes: ['SRM', 'SJR', 'ZT'], room: 'LHC-208' },
    { time: '11:05–12:00', subject: 'RMIPR', codes: ['AP'], room: 'LHC-208' },
    { time: '12:00–12:55', subject: 'ML', codes: ['KKS'], room: 'LHC-208' },
    { time: '13:45–14:40', subject: 'CN', codes: ['CV'], room: 'LHC-208' },
    { time: '14:40–15:35', subject: 'SE', codes: ['SB'], room: 'LHC-208' },
    // V B
    { time: '09:00–09:55', subject: 'CN', codes: ['SKR'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'ML', codes: ['SM'], room: 'LHC-210' },
    { time: '11:05–12:00', subject: 'TOC Tut', codes: ['SS', 'DM', 'SK'], room: 'LHC-210' },
    { time: '12:00–12:55', subject: 'TOC Tut', codes: ['SS', 'DM', 'SK'], room: 'LHC-210' },
    { time: '13:45–14:40', subject: 'ML LAB3', codes: ['SG', 'GV', 'SKS', 'ZT'], room: 'DES-208' },
    { time: '14:40–15:35', subject: 'ML LAB3', codes: ['SG', 'GV', 'SKS', 'ZT'], room: 'DES-208' },
    // V C
    { time: '09:00–09:55', subject: 'ML LAB2', codes: ['SG', 'KS', 'KKS'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'ML LAB2', codes: ['SG', 'KS', 'KKS'], room: 'DES-308' },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'], room: 'LHC-212' },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['PMK'], room: 'LHC-212' },
    // VII A
    { time: '09:00–09:55', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'SS'], room: 'DES-207' },
    { time: '09:55–10:50', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'SS'], room: 'DES-207' },
    { time: '11:05–12:00', subject: 'DC', codes: ['PSR'], room: 'LHC-301' },
    { time: '12:00–12:55', subject: 'IS', codes: ['GV'], room: 'LHC-301' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'], room: 'LHC-301' },
    // VII B
    { time: '09:00–09:55', subject: 'DC', codes: ['SK'], room: 'LHC-302' },
    { time: '09:55–10:50', subject: 'ST', codes: ['PMN'], room: 'LHC-302' },
    { time: '11:05–12:00', subject: 'GEN AI LAB2', codes: ['SB', 'ED', 'CV'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'GEN AI LAB2', codes: ['SB', 'ED', 'CV'], room: 'DES-308' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'], room: 'LHC-302' },
    { time: '14:40–15:35', subject: 'IS', codes: ['ED'], room: 'LHC-302' }
  ],

  Wednesday: [
    // MTech I
    { time: '09:00–09:55', subject: 'DV LAB', codes: ['PMK', 'SRM'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'DV LAB', codes: ['PMK', 'SRM'], room: 'DES-308' },
    { time: '11:05–12:00', subject: 'AI', codes: ['YHK'], room: 'DES-106' },
    // I Q
    { time: '09:55–10:50', subject: 'Intro C', codes: ['SJR'], room: 'LHC-204' },
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'], room: 'LHC-206' },
    // I E
    { time: '09:00–09:55', subject: 'C Prg LAB2', codes: ['LMM', 'KKS', 'SG', 'GV', 'ZT'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'C Prg LAB2', codes: ['LMM', 'KKS', 'SG', 'GV', 'ZT'], room: 'DES-308' },
    { time: '13:45–14:40', subject: 'IDT lab1', codes: ['SKR', 'PRA', 'GV'], room: 'DES-207' },
    { time: '14:40–15:35', subject: 'IDT lab1', codes: ['SKR', 'PRA', 'GV'], room: 'DES-207' },
    // I U
    { time: '11:05–12:00', subject: 'Intro C Lab2', codes: ['SS', 'DM', 'KKS', 'ZT'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'Intro C Lab2', codes: ['SS', 'DM', 'KKS', 'ZT'], room: 'DES-308' },
    // I V
    { time: '13:45–14:40', subject: 'Intro C', codes: ['SP'], room: 'LHC-210' },
    // III A
    { time: '09:55–10:50', subject: 'DS', codes: ['KS'], room: 'Room-101' },
    { time: '11:05–12:00', subject: 'DMS', codes: ['PRA'], room: 'Room-101' },
    { time: '13:45–14:40', subject: 'DCO LAB3', codes: ['YHK', 'PSR', 'SP'], room: 'DES-208' },
    { time: '14:40–15:35', subject: 'DCO LAB3', codes: ['YHK', 'PSR', 'SP'], room: 'DES-208' },
    // III B
    { time: '09:55–10:50', subject: 'DMS', codes: ['PSR'], room: 'Room-102' },
    { time: '11:05–12:00', subject: 'DS', codes: ['DM'], room: 'Room-102' },
    { time: '12:00–12:55', subject: 'DCO', codes: ['SKS'], room: 'Room-102' },
    { time: '13:45–14:40', subject: 'OOP', codes: ['ED'], room: 'Room-102' },
    // III C
    { time: '09:00–09:55', subject: 'OOP', codes: ['SP'], room: 'LHC-204' },
    { time: '09:55–10:50', subject: 'DCO', codes: ['AP'], room: 'LHC-204' },
    { time: '11:05–12:00', subject: 'DS LAB2', codes: ['LMM', 'KS', 'SK'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'DS LAB2', codes: ['LMM', 'KS', 'SK'], room: 'DES-308' },
    { time: '13:45–14:40', subject: 'MATHS', codes: ['SS'], room: 'LHC-204' },
    { time: '14:40–15:35', subject: 'DMS', codes: ['CV'], room: 'LHC-204' },
    // V A
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-208' },
    { time: '09:55–10:50', subject: 'CN', codes: ['CV'], room: 'LHC-208' },
    { time: '11:05–12:00', subject: 'SE LAB3', codes: ['SB', 'AP', 'DJS', 'CV'], room: 'DES-208' },
    { time: '12:00–12:55', subject: 'SE LAB3', codes: ['SB', 'AP', 'DJS', 'CV'], room: 'DES-208' },
    // V B
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'ML', codes: ['SM'], room: 'LHC-210' },
    { time: '11:05–12:00', subject: 'TOC', codes: ['SS'], room: 'LHC-210' },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['GV'], room: 'LHC-210' },
    // V C
    { time: '09:55–10:50', subject: 'CN', codes: ['SKR'], room: 'LHC-212' },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'], room: 'LHC-212' },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SJR'], room: 'LHC-212' },
    { time: '13:45–14:40', subject: 'RMIPR', codes: ['PMK'], room: 'LHC-212' },
    { time: '14:40–15:35', subject: 'SE', codes: ['PMN'], room: 'LHC-212' },
    // VII A
    { time: '09:00–09:55', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'PMN'], room: 'DES-207' },
    { time: '09:55–10:50', subject: 'GEN AI LAB1', codes: ['ED', 'SB', 'PMN'], room: 'DES-207' },
    { time: '11:05–12:00', subject: 'ST', codes: ['KKS'], room: 'LHC-301' },
    { time: '12:00–12:55', subject: 'DC', codes: ['PSR'], room: 'LHC-301' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['SRM'], room: 'LHC-301' },
    // VII B
    { time: '09:00–09:55', subject: 'DC LAB3', codes: ['SK', 'SS', 'DM'], room: 'DES-208' },
    { time: '09:55–10:50', subject: 'DC LAB3', codes: ['SK', 'SS', 'DM'], room: 'DES-208' },
    { time: '11:05–12:00', subject: 'ST', codes: ['PMN'], room: 'LHC-302' },
    { time: '12:00–12:55', subject: 'IS', codes: ['ED'], room: 'LHC-302' },
    { time: '13:45–14:40', subject: 'OE-CC', codes: ['KS'], room: 'LHC-302' }
  ],

  Thursday: [
    // MTech I
    { time: '09:55–10:50', subject: 'SDS', codes: ['PMK'], room: 'DES-106' },
    { time: '11:05–12:00', subject: 'SDS', codes: ['PMK'], room: 'DES-106' },
    { time: '12:00–12:55', subject: 'DM', codes: ['SKS'], room: 'DES-106' },
    { time: '13:45–14:40', subject: 'BD LAB', codes: ['SP', 'PSR'], room: 'DES-308' },
    { time: '14:40–15:35', subject: 'BD LAB', codes: ['SP', 'PSR'], room: 'DES-308' },
    // I Q
    { time: '11:05–12:00', subject: 'Intro C', codes: ['SJR'], room: 'LHC-204' },
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'], room: 'LHC-206' },
    // I E
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['LMM'], room: 'LHC-206' },
    // III A
    { time: '11:05–12:00', subject: 'OOP', codes: ['SM'], room: 'Room-101' },
    { time: '12:00–12:55', subject: 'DMS', codes: ['PRA'], room: 'Room-101' },
    { time: '13:45–14:40', subject: 'DS LAB2', codes: ['KS', 'SK', 'ZT'], room: 'DES-308' },
    { time: '14:40–15:35', subject: 'DS LAB2', codes: ['KS', 'SK', 'ZT'], room: 'DES-308' },
    // III B
    { time: '09:55–10:50', subject: 'OOP', codes: ['ED'], room: 'Room-102' },
    { time: '11:05–12:00', subject: 'OOP LAB1', codes: ['ED', 'ZT', 'DJS', 'CV'], room: 'DES-207' },
    { time: '12:00–12:55', subject: 'OOP LAB1', codes: ['ED', 'ZT', 'DJS', 'CV'], room: 'DES-207' },
    { time: '13:45–14:40', subject: 'DCO', codes: ['SKS'], room: 'Room-102' },
    // III C
    { time: '11:05–12:00', subject: 'OOP', codes: ['SP'], room: 'LHC-204' },
    { time: '12:00–12:55', subject: 'DCO', codes: ['AP'], room: 'LHC-204' },
    { time: '13:45–14:40', subject: 'DCO LAB3', codes: ['AP', 'SB', 'PMN'], room: 'DES-208' },
    { time: '14:40–15:35', subject: 'DCO LAB3', codes: ['AP', 'SB', 'PMN'], room: 'DES-208' },
    // V A
    { time: '09:00–09:55', subject: 'RMIPR', codes: ['AP'], room: 'LHC-208' },
    { time: '09:55–10:50', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-208' },
    { time: '11:05–12:00', subject: 'TOC', codes: ['SRM'], room: 'LHC-208' },
    { time: '12:00–12:55', subject: 'TOC', codes: ['SRM'], room: 'LHC-208' },
    { time: '13:45–14:40', subject: 'CN', codes: ['CV'], room: 'LHC-208' },
    { time: '14:40–15:35', subject: 'ML', codes: ['KKS'], room: 'LHC-208' },
    // V B
    { time: '09:00–09:55', subject: 'SE', codes: ['DM'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-210' },
    { time: '11:05–12:00', subject: 'SE', codes: ['DM'], room: 'LHC-210' },
    { time: '12:00–12:55', subject: 'RMIPR', codes: ['GV'], room: 'LHC-210' },
    { time: '13:45–14:40', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'], room: 'DES-207' },
    { time: '14:40–15:35', subject: 'CN LAB1', codes: ['SKR', 'PRA', 'SS'], room: 'DES-207' },
    // V C
    { time: '09:00–09:55', subject: 'TOC', codes: ['SJR'], room: 'LHC-212' },
    { time: '11:05–12:00', subject: 'CN', codes: ['SKR'], room: 'LHC-212' },
    { time: '12:00–12:55', subject: 'SE', codes: ['PMN'], room: 'LHC-212' },
    { time: '13:45–14:40', subject: 'ML', codes: ['SG'], room: 'LHC-212' },
    { time: '14:40–15:35', subject: 'ML', codes: ['SG'], room: 'LHC-212' },
    // VII A
    { time: '09:00–09:55', subject: 'BD LAB2', codes: ['SKS', 'LMM', 'PSR'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'BD LAB2', codes: ['SKS', 'LMM', 'PSR'], room: 'DES-308' },
    { time: '11:05–12:00', subject: 'DC', codes: ['PSR'], room: 'LHC-301' },
    { time: '12:00–12:55', subject: 'ST', codes: ['KKS'], room: 'LHC-301' },
    { time: '13:45–14:40', subject: 'IS', codes: ['GV'], room: 'LHC-301' },
    // VII B
    { time: '09:00–09:55', subject: 'ST', codes: ['PMN'], room: 'LHC-302' },
    { time: '09:55–10:50', subject: 'DC', codes: ['SK'], room: 'LHC-302' },
    { time: '11:05–12:00', subject: 'GEN AI LAB2', codes: ['SB', 'SS', 'KS'], room: 'DES-308' },
    { time: '12:00–12:55', subject: 'GEN AI LAB2', codes: ['SB', 'SS', 'KS'], room: 'DES-308' }
  ],

  Friday: [
    // MTech I
    { time: '09:55–10:50', subject: 'DM', codes: ['SKS'], room: 'DES-106' },
    { time: '11:05–12:00', subject: 'SDS', codes: ['PMK'], room: 'DES-106' },
    { time: '12:00–12:55', subject: 'AI', codes: ['YHK'], room: 'DES-106' },
    // I D
    { time: '09:00–09:55', subject: 'C Prg LAB2', codes: ['SG', 'SK', 'ZT', 'CV', 'PSR'], room: 'DES-308' },
    { time: '09:55–10:50', subject: 'C Prg LAB2', codes: ['SG', 'SK', 'ZT', 'CV', 'PSR'], room: 'DES-308' },
    // I E
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['LMM'], room: 'LHC-206' },
    // I U
    { time: '09:00–09:55', subject: 'Intro C', codes: ['SS'], room: 'LHC-208' },
    // III A
    { time: '09:00–09:55', subject: 'DS', codes: ['KS'], room: 'Room-101' },
    { time: '09:55–10:50', subject: 'DCO', codes: ['YHK'], room: 'Room-101' },
    { time: '11:05–12:00', subject: 'UHV', codes: ['KKS'], room: 'Room-101' },
    { time: '12:00–12:55', subject: 'EE', codes: ['DJS'], room: 'Room-101' },
    // III B
    { time: '09:00–09:55', subject: 'DS', codes: ['DM'], room: 'Room-102' },
    { time: '09:55–10:50', subject: 'OOP', codes: ['ED'], room: 'Room-102' },
    { time: '11:05–12:00', subject: 'UHV', codes: ['DM'], room: 'Room-102' },
    { time: '12:00–12:55', subject: 'EE', codes: ['SK'], room: 'Room-102' },
    // III C
    { time: '09:00–09:55', subject: 'MATHS', codes: ['SS'], room: 'LHC-204' },
    { time: '09:55–10:50', subject: 'OOP', codes: ['SP'], room: 'LHC-204' },
    { time: '12:00–12:55', subject: 'G-IT', codes: ['PRA'], room: 'LHC-204' },
    // V A
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-208' },
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'], room: 'LHC-208' },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'], room: 'LHC-208' },
    { time: '11:05–12:00', subject: 'CN LAB1', codes: ['CV', 'SJR', 'SRM'], room: 'DES-207' },
    { time: '12:00–12:55', subject: 'CN LAB1', codes: ['CV', 'SJR', 'SRM'], room: 'DES-207' },
    // V B
    { time: '09:00–09:55', subject: 'AI', codes: ['DJS', 'PRA'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'], room: 'LHC-210' },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'], room: 'LHC-210' },
    { time: '11:05–12:00', subject: 'ML', codes: ['SM'], room: 'LHC-210' },
    { time: '12:00–12:55', subject: 'CN', codes: ['SKR'], room: 'LHC-210' },
    // V C
    { time: '09:55–10:50', subject: 'ReactJS', codes: ['AP', 'SJR'], room: 'LHC-212' },
    { time: '09:55–10:50', subject: 'EE', codes: ['SRM'], room: 'LHC-212' },
    { time: '11:05–12:00', subject: 'SE LAB3', codes: ['PMN', 'SB', 'GV'], room: 'DES-208' },
    { time: '12:00–12:55', subject: 'SE LAB3', codes: ['PMN', 'SB', 'GV'], room: 'DES-208' }
  ],

  Saturday: [
    // I D
    { time: '11:05–12:00', subject: 'Prg in C', codes: ['SG'], room: 'LHC-206' },
    // I V
    { time: '09:00–09:55', subject: 'Intro C Lab1', codes: ['SP', 'SJR', 'SB', 'SK', 'ZT'], room: 'DES-207' },
    { time: '09:55–10:50', subject: 'Intro C Lab1', codes: ['SP', 'SJR', 'SB', 'SK', 'ZT'], room: 'DES-207' }
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
            subject: entry.subject,
            room: entry.room || ''
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
