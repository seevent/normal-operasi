// src/lib/services/checklistSyncService.ts
import { supabase } from '../supabaseClient';
import { getCurrentShiftKey, mapStoringToChecklistSupervisorKeys } from '../utils/locationRules';

export interface ChecklistShiftDataValue {
  shiftKey: string;
  supervisorMap: Record<string, string>;
  earliestWaktuMulai: string;
  latestWaktuSelesai: string;
  senderId?: string;
  updatedAt: string;
}

const DEFAULT_SHIFT_DATA = (shiftKey: string): ChecklistShiftDataValue => ({
  shiftKey,
  supervisorMap: {},
  earliestWaktuMulai: '',
  latestWaktuSelesai: '',
  updatedAt: new Date().toISOString()
});

export const fetchChecklistShiftData = async (): Promise<ChecklistShiftDataValue> => {
  const currentShiftKey = getCurrentShiftKey();
  try {
    const { data, error } = await supabase
      .from('master_configs')
      .select('value')
      .eq('key', 'checklist_shift_data')
      .maybeSingle();

    if (!error && data && data.value) {
      const val = data.value as ChecklistShiftDataValue;
      if (val.shiftKey === currentShiftKey) {
        return val;
      }
    }
  } catch (err) {
    console.error('Gagal membaca data shift checklist dari Supabase:', err);
  }
  return DEFAULT_SHIFT_DATA(currentShiftKey);
};

export const saveStoringToChecklistSync = async (
  storingData: {
    supervisorAvsec?: string;
    acLokasi?: string[];
    acNomor?: Record<string, string>;
    waktuMulai?: string;
    waktuSelesai?: string;
  },
  channelRef?: any,
  senderId?: string
): Promise<ChecklistShiftDataValue> => {
  const currentShiftKey = getCurrentShiftKey();
  const currentData = await fetchChecklistShiftData();

  const newSupervisorMap = { ...(currentData.supervisorMap || {}) };

  // Map supervisor Avsec if provided
  if (storingData.supervisorAvsec && storingData.supervisorAvsec.trim() !== '') {
    const keys = mapStoringToChecklistSupervisorKeys(storingData.acLokasi || [], storingData.acNomor || {});
    keys.forEach(k => {
      newSupervisorMap[k] = storingData.supervisorAvsec!.trim();
    });
  }

  // Earliest waktu mulai
  let earliestWaktuMulai = currentData.earliestWaktuMulai || '';
  if (storingData.waktuMulai) {
    if (!earliestWaktuMulai || storingData.waktuMulai < earliestWaktuMulai) {
      earliestWaktuMulai = storingData.waktuMulai;
    }
  }

  // Latest waktu selesai
  let latestWaktuSelesai = currentData.latestWaktuSelesai || '';
  const endCandidate = storingData.waktuSelesai || storingData.waktuMulai || '';
  if (endCandidate) {
    if (!latestWaktuSelesai || endCandidate > latestWaktuSelesai) {
      latestWaktuSelesai = endCandidate;
    }
  }

  const payload: ChecklistShiftDataValue = {
    shiftKey: currentShiftKey,
    supervisorMap: newSupervisorMap,
    earliestWaktuMulai,
    latestWaktuSelesai,
    senderId,
    updatedAt: new Date().toISOString()
  };

  // Broadcast realtime
  if (channelRef) {
    channelRef.send({
      type: 'broadcast',
      event: 'shift_data_update',
      payload
    }).catch((err: any) => console.error('Broadcast shift_data_update error:', err));
  }

  try {
    await supabase.from('master_configs').upsert(
      { key: 'checklist_shift_data', value: payload, updated_at: payload.updatedAt },
      { onConflict: 'key' }
    );
  } catch (err) {
    console.error('Error saving checklist shift data to Supabase:', err);
  }

  return payload;
};

export const saveChecklistSupervisorDirect = async (
  supervisorMap: Record<string, string>,
  channelRef?: any,
  senderId?: string
): Promise<ChecklistShiftDataValue> => {
  const currentShiftKey = getCurrentShiftKey();
  const currentData = await fetchChecklistShiftData();

  const payload: ChecklistShiftDataValue = {
    ...currentData,
    shiftKey: currentShiftKey,
    supervisorMap,
    senderId,
    updatedAt: new Date().toISOString()
  };

  if (channelRef) {
    channelRef.send({
      type: 'broadcast',
      event: 'shift_data_update',
      payload
    }).catch((err: any) => console.error('Broadcast shift_data_update error:', err));
  }

  try {
    await supabase.from('master_configs').upsert(
      { key: 'checklist_shift_data', value: payload, updated_at: payload.updatedAt },
      { onConflict: 'key' }
    );
  } catch (err) {
    console.error('Error saving direct supervisor checklist data to Supabase:', err);
  }

  return payload;
};
