-- Access Control System Pintu Lift Difable E (ESE121000074892) dipindah ke gudang, sama seperti
-- Walk Through Metal Detector PSCP 2D No.5 (ESE061000074775). Aset dengan location_override 'Gudang'
-- tidak dihitung preventif dan tampil di area Gudang tab Preventive (src/lib/utils/preventiveGrouping.ts).
update public.prima_assets
set location_override = 'Gudang'
where equipment_number = 'ESE121000074892';
