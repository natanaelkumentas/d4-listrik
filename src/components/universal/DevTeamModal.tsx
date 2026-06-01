"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { HiOutlineXMark, HiOutlineCodeBracket } from "react-icons/hi2";
import { devTeam, lecturerInfo } from "@/lib/devTeam";

interface DevTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvatarProps {
  url?: string | null;
  initials: string;
  gradient: string;
  className?: string;
  sizeClass: string;
}

function Avatar({ url, initials, gradient, className = "", sizeClass }: AvatarProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [url]);

  if (url && !error) {
    return (
      <img
        src={url}
        alt={initials}
        onError={() => setError(true)}
        className={`${sizeClass} rounded-full object-cover shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

export default function DevTeamModal({ isOpen, onClose }: DevTeamModalProps) {
  const [mounted, setMounted] = useState(false);
  const [developers, setDevelopers] = useState<any[]>(devTeam);
  const [lecturer, setLecturer] = useState<any>(lecturerInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const loadDevelopers = async () => {
      try {
        const res = await fetch("/api/developers");
        if (!res.ok) throw new Error("Gagal mengambil data pengembang");
        const data = await res.json();
        
        if (data && typeof data === "object" && "developers" in data) {
          if (Array.isArray(data.developers) && data.developers.length > 0) {
            setDevelopers(data.developers);
          }
          if (data.lecturer) {
            setLecturer(data.lecturer);
          }
        } else if (Array.isArray(data) && data.length > 0) {
          setDevelopers(data);
        }
      } catch (err) {
        console.error("Error loading developers from database, falling back to static list:", err);
        setDevelopers(devTeam);
        setLecturer(lecturerInfo);
      } finally {
        setLoading(false);
      }
    };

    loadDevelopers();
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white text-gray-900 w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-6 md:p-8 relative overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-600 via-accent-400 to-indigo-600 flex-shrink-0" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer z-10 flex-shrink-0"
          aria-label="Tutup"
        >
          <HiOutlineXMark className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-5 sm:gap-6 min-h-0 pt-2 pb-2">
          {/* Header */}
          <div className="text-left pr-8 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/70 border border-primary-200 text-primary-900 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
              <HiOutlineCodeBracket className="w-3.5 h-3.5" /> Project Based Learning (PBL)
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-primary-950 leading-tight">
              Tim Pengembang Website
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 mt-1.5">
              Website ini dikembangkan oleh Kelompok 3 Kelas 6TI7, Program Studi <strong>D4 Teknik Informatika</strong>, Politeknik Negeri Manado sebagai bagian dari Project Based Learning (PBL) mata kuliah <strong>Teknologi Web</strong>.
            </p>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {developers.map((member, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-primary-300 transition-colors duration-200"
              >
                {member.link ? (
                  <a
                    href={member.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2.5 sm:mb-3.5"
                  >
                    <Avatar
                      url={member.foto_url}
                      initials={member.initials}
                      gradient={member.gradient}
                      sizeClass="w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg"
                    />
                  </a>
                ) : (
                  <div className="mb-2.5 sm:mb-3.5">
                    <Avatar
                      url={member.foto_url}
                      initials={member.initials}
                      gradient={member.gradient}
                      sizeClass="w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg"
                    />
                  </div>
                )}
                
                {member.link ? (
                  <a
                    href={member.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold text-gray-900 hover:text-primary-600 text-xs sm:text-sm leading-tight mb-1 truncate w-full hover:underline transition-colors duration-150"
                  >
                    {member.nama}
                  </a>
                ) : (
                  <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm leading-tight mb-1 truncate w-full">
                    {member.nama}
                  </h3>
                )}
                
                <code className="text-[10px] sm:text-xs bg-gray-200/85 text-gray-800 font-mono px-2 py-0.5 rounded-md mb-2.5 select-all">
                  NIM. {member.nim}
                </code>
                
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${member.bg}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          {/* Lecturer Section */}
          <div className="pt-2 border-t border-gray-100 flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">
              Dosen Pengajar
            </span>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center gap-3 w-full max-w-xs hover:border-primary-300 transition-all duration-200 group">
              {lecturer.link ? (
                lecturer.link.startsWith("/") ? (
                  <Link
                    href={lecturer.link}
                    onClick={onClose}
                  >
                    <Avatar
                      url={lecturer.foto_url}
                      initials={lecturer.initials}
                      gradient="from-primary-950 to-primary-900"
                      sizeClass="w-9 h-9 text-[10px]"
                    />
                  </Link>
                ) : (
                  <a
                    href={lecturer.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Avatar
                      url={lecturer.foto_url}
                      initials={lecturer.initials}
                      gradient="from-primary-950 to-primary-900"
                      sizeClass="w-9 h-9 text-[10px]"
                    />
                  </a>
                )
              ) : (
                <div>
                  <Avatar
                    url={lecturer.foto_url}
                    initials={lecturer.initials}
                    gradient="from-primary-950 to-primary-900"
                    sizeClass="w-9 h-9 text-[10px]"
                  />
                </div>
              )}
              <div className="text-left min-w-0">
                {lecturer.link ? (
                  lecturer.link.startsWith("/") ? (
                    <Link
                      href={lecturer.link}
                      onClick={onClose}
                      className="font-extrabold text-gray-900 hover:text-primary-600 text-xs leading-tight block truncate hover:underline transition-colors"
                    >
                      {lecturer.nama}
                    </Link>
                  ) : (
                    <a
                      href={lecturer.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-gray-900 hover:text-primary-600 text-xs leading-tight block truncate hover:underline transition-colors"
                    >
                      {lecturer.nama}
                    </a>
                  )
                ) : (
                  <h4 className="font-extrabold text-gray-900 text-xs leading-tight truncate">
                    {lecturer.nama}
                  </h4>
                )}
                <p className="text-[10px] text-gray-600 truncate mt-0.5">
                  {lecturer.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
          <span className="text-center sm:text-left font-medium">
            D4 Teknik Informatika — Politeknik Negeri Manado
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-primary-950 text-white rounded-xl font-bold hover:bg-primary-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
