import { ChangeEvent } from 'react';

export default function currencyChangeHandler(e: ChangeEvent<HTMLInputElement>, setData: (key: string, value: number) => void, formKey: string) {
    const value = e.target.value;
    if (value === '') {
        setData(formKey, 0);
    } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setData(formKey, Math.round(numValue * 100));
        }
    }
}
