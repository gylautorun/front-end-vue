import {computed, reactive} from 'vue';

export interface FormValidationRules {
    [key: keyof FormInitialValues]: Array<{
        validate: (value: any) => boolean;
        message: string;
    }>
}
export interface FormInitialValues {
    [key: string]: unknown;
}
export interface FormErrors {
    [key: keyof FormInitialValues]: string | null;
}
export type FieldValue = keyof FormInitialValues;
export function useFormValidation(initialValues: FormInitialValues, validationRules: FormValidationRules) {
    const form = reactive({...initialValues});
    const errors = reactive<FormErrors>({});
    const validateField = (field: FieldValue) => {
        const value = form[field];
        const rules = validationRules[field];
        if (!rules) {
            return;
        };
        for (const rule of rules){
            const isValid = rule.validate?.(value);
            if(isValid) {
                errors[field] = rule.message;
                break;
            }
        }
    };
    const validateAll = () => {
        for (const field in validationRules) {
            validateField(field);
        }
        return Object.values(errors).every((error) => !error);
    };
    const hasErrors = computed(() => {
        return Object.values(errors).some((error) => !!error);
    });
    const setFieldValue = (field: FieldValue, value: unknown) => {
        form[field] = value;
        validateField(field);
    };
    const resetForm = () => {
        Object.assign(form,initialValues);
        for (const field in errors) {
            errors[field] = null;
        }
    };

    return {
        form,
        errors,
        validateField,
        validateAll,
        hasErrors,
        setFieldValue,
        resetForm
    };
}