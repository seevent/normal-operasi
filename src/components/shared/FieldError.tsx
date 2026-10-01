import React from 'react';
import { AlertCircle } from 'lucide-react';

/** Kelas pembatas merah untuk isian yang wajib tetapi masih kosong. */
export const FIELD_ERROR_CLASS = 'border-red-500 ring-2 ring-red-300 bg-red-50/50';

/** Tulisan merah di bawah isian kosong; tidak menggambar apa pun bila `show` false. */
export const FieldError: React.FC<{ show: boolean; message: string }> = ({ show, message }) =>
  show ? (
    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5" /> {message}
    </p>
  ) : null;
