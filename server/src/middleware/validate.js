/**
 * Tiny request-body validator. Deliberately dependency-free and permissive
 * about unknown keys: it exists to reject obviously bad input early and give
 * the client a per-field message, not to model the whole domain.
 *
 *   validateBody({ username: { type: 'string', required: true, min: 3, max: 32 } })
 */

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function checkField(name, rule, value) {
  if (isBlank(value)) {
    return rule.required ? `${rule.label || name} là bắt buộc` : null;
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') return `${rule.label || name} phải là chuỗi`;
      const len = value.trim().length;
      if (rule.min && len < rule.min) return `${rule.label || name} phải có ít nhất ${rule.min} ký tự`;
      if (rule.max && len > rule.max) return `${rule.label || name} không được vượt quá ${rule.max} ký tự`;
      if (rule.pattern && !rule.pattern.test(value)) return rule.message || `${rule.label || name} không đúng định dạng`;
      if (rule.enum && !rule.enum.includes(value)) return `${rule.label || name} phải thuộc: ${rule.enum.join(', ')}`;
      return null;
    }
    case 'number': {
      const n = Number(value);
      if (!Number.isFinite(n)) return `${rule.label || name} phải là số`;
      if (rule.min !== undefined && n < rule.min) return `${rule.label || name} phải >= ${rule.min}`;
      if (rule.max !== undefined && n > rule.max) return `${rule.label || name} phải <= ${rule.max}`;
      return null;
    }
    case 'boolean':
      return typeof value === 'boolean' || value === 0 || value === 1 ? null : `${rule.label || name} phải là true/false`;
    case 'array':
      if (!Array.isArray(value)) return `${rule.label || name} phải là danh sách`;
      if (rule.max && value.length > rule.max) return `${rule.label || name} tối đa ${rule.max} phần tử`;
      return null;
    default:
      return null;
  }
}

export function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const fields = {};

    for (const [name, rule] of Object.entries(schema)) {
      const problem = checkField(name, rule, body[name]);
      if (problem) fields[name] = problem;
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: Object.values(fields)[0],
        fields
      });
    }
    next();
  };
}

export const rules = {
  username: { type: 'string', required: true, min: 3, max: 32, label: 'Tên đăng nhập', pattern: /^[a-zA-Z0-9._-]+$/, message: 'Tên đăng nhập chỉ gồm chữ, số và . _ -' },
  password: { type: 'string', required: true, min: 6, max: 128, label: 'Mật khẩu' },
  fullName: { type: 'string', required: true, min: 1, max: 80, label: 'Họ tên' }
};
