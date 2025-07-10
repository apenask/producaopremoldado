import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface AlertPersonalizadoProps {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  titulo: string;
  mensagem: string;
  visivel: boolean;
  onFechar: () => void;
}

const AlertPersonalizado: React.FC<AlertPersonalizadoProps> = ({
  tipo,
  titulo,
  mensagem,
  visivel,
  onFechar
}) => {
  if (!visivel) return null;

  const configs = {
    sucesso: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    },
    erro: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    aviso: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    }
  };

  const config = configs[tipo];
  const IconComponent = config.icon;

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 max-w-xs sm:max-w-md">
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 sm:p-4 shadow-lg`}>
        <div className="flex items-start space-x-2 sm:space-x-3">
          <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${config.titleColor} mb-1 text-sm sm:text-base`}>
              {titulo}
            </h4>
            <p className={`text-xs sm:text-sm ${config.textColor} break-words`}>
              {mensagem}
            </p>
          </div>
          <button
            onClick={onFechar}
            className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          >
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPersonalizado;