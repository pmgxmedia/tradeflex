const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 shadow-blue-500/50 hover:shadow-blue-600/60 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    secondary: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/50 hover:shadow-emerald-600/60 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    success: 'bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 shadow-green-500/50 hover:shadow-green-600/60 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    danger: 'bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 text-white hover:from-rose-600 hover:via-pink-700 hover:to-red-700 shadow-rose-500/50 hover:shadow-rose-600/60 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 shadow-gray-200/50 hover:shadow-blue-300/50 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-100/20 before:to-purple-100/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    ghost: 'text-gray-700 hover:text-blue-600 bg-gray-100/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-none hover:shadow-md hover:shadow-blue-200/50 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-200/30 before:to-purple-200/30 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    white: 'bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-700 shadow-md hover:shadow-lg border border-gray-200',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </span>
    </button>
  );
};

export default Button;
