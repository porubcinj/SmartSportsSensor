import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

interface EnumSelectProps<T> {
  label: string;
  value: T | null;
  onChange: (value: T | null) => void;
  options: { label: string; value: T }[];
  defaultLabel?: string;
};

export const EnumSelect = <T extends number>({
  label,
  value,
  onChange,
  options,
  defaultLabel = 'None',
}: EnumSelectProps<T>) => {
  return (
    <FormControl>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value === null ? defaultLabel : value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === defaultLabel ? null : Number(val) as T);
        }}
      >
        <MenuItem value={defaultLabel}>{defaultLabel}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};