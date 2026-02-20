import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Zap, Mail, Lock, User, Phone, Loader2, 
  ArrowRight, ArrowLeft, Wrench, CheckCircle, FileText, 
  ClipboardList, UserCheck, Store, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TechnicianRegistrationFields } from "@/components/technician/TechnicianRegistrationFields";
import { TechnicianInterviewForm, InterviewData } from "@/components/technician/TechnicianInterviewForm";
import { VendorInterviewForm, VendorInterviewData } from "@/components/vendor/VendorInterviewForm";
import { DeliveryInterviewForm, DeliveryInterviewData } from "@/components/delivery/DeliveryInterviewForm";
import { ClientTypeSelector } from "@/components/client/ClientTypeSelector";
import { OrganizationFields } from "@/components/client/OrganizationFields";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { supabase } from "@/integrations/supabase/client";

type Step = "role" | "interview" | "documents" | "account";
type UserRole = "client" | "technician" | "vendor" | "delivery";

const stepConfig: Record<UserRole, Step[]> = {
  client: ["role", "account"],
  technician: ["role", "interview", "documents", "account"],
  vendor: ["role", "interview", "documents", "account"],
  delivery: ["role", "interview", "documents", "account"],
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(
    (searchParams.get("role") as UserRole) || "client"
  );
  const [clientType, setClientType] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  // Organization-specific fields
  const [companyName, setCompanyName] = useState("");
  const [nif, setNif] = useState("");

  // Vendor-specific fields
  const [storeName, setStoreName] = useState("");
  const [vendorType, setVendorType] = useState("singular");

  // Delivery-specific fields
  const [vehicleType, setVehicleType] = useState("");

  // Technician-specific fields
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [interviewData, setInterviewData] = useState<InterviewData>({
    yearsExperience: "",
    availability: "",
    workAreas: [],
    hasOwnTools: false,
    hasTransport: false,
    certifications: "",
    motivation: "",
    previousExperience: "",
  });

  // Vendor interview data
  const [vendorInterviewData, setVendorInterviewData] = useState<VendorInterviewData>({
    yearsExperience: "",
    availability: "",
    workAreas: [],
    storeType: "",
    hasPhysicalStore: false,
    hasDeliveryCapability: false,
    certifications: "",
    motivation: "",
    previousExperience: "",
    productCategories: [],
    estimatedProducts: "",
  });

  // Delivery interview data
  const [deliveryInterviewData, setDeliveryInterviewData] = useState<DeliveryInterviewData>({
    yearsExperience: "",
    availability: "",
    workAreas: [],
    vehicleType: "",
    hasLicense: false,
    hasInsurance: false,
    certifications: "",
    motivation: "",
    previousExperience: "",
    knowledgeOfCity: "",
    maxDeliveryRadius: "",
  });

  const [vendorDocuments, setVendorDocuments] = useState<File[]>([]);
  const [deliveryDocuments, setDeliveryDocuments] = useState<File[]>([]);
  const { uploadDocuments, uploading } = useDocumentUpload();
  // Get steps based on role
  const steps = stepConfig[role];
  const currentStepIndex = steps.indexOf(currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Update step when role changes
  useEffect(() => {
    if (currentStep !== "role" && !stepConfig[role].includes(currentStep)) {
      setCurrentStep("role");
    }
  }, [role, currentStep]);

  const canProceed = () => {
    switch (currentStep) {
      case "role":
        return true;
      case "interview":
        if (role === "vendor") {
          return (
            vendorInterviewData.yearsExperience &&
            vendorInterviewData.availability &&
            vendorInterviewData.workAreas.length > 0 &&
            vendorInterviewData.motivation &&
            vendorInterviewData.productCategories.length > 0
          );
        }
        if (role === "delivery") {
          return (
            deliveryInterviewData.yearsExperience &&
            deliveryInterviewData.availability &&
            deliveryInterviewData.workAreas.length > 0 &&
            deliveryInterviewData.motivation &&
            deliveryInterviewData.vehicleType
          );
        }
        return (
          interviewData.yearsExperience &&
          interviewData.availability &&
          interviewData.workAreas.length > 0 &&
          interviewData.motivation
        );
      case "documents":
        if (role === "technician") return selectedSpecialties.length > 0 && documents.length > 0;
        if (role === "vendor") return vendorDocuments.length > 0;
        if (role === "delivery") return deliveryDocuments.length > 0;
        return true;
      case "account":
        if (role === "client") {
          if (clientType === "personal") {
            return name && email && phone && password && confirmPassword;
          } else {
            return companyName && nif && email && phone && password && confirmPassword;
          }
        }
        if (role === "vendor") {
          if (vendorType === "empresa") {
            return storeName && nif && name && email && phone && password && confirmPassword;
          }
          return storeName && name && email && phone && password && confirmPassword;
        }
        if (role === "delivery") {
          return vehicleType && name && email && phone && password && confirmPassword;
        }
        return name && email && phone && password && confirmPassword;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique as senhas digitadas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const metadata: Record<string, any> = { 
        name: role === "client" && clientType !== "personal" ? companyName.trim() : (role === "vendor" ? storeName.trim() : name), 
        phone, 
        role, 
        client_type: role === "client" ? clientType : undefined,
      };

      if (role === "vendor") {
        metadata.store_name = storeName.trim();
        metadata.vendor_type = vendorType;
      }

      if (role === "delivery") {
        metadata.vehicle_type = deliveryInterviewData.vehicleType || vehicleType;
      }

      if (role === "client" && clientType !== "personal") {
        metadata.company_name = companyName.trim();
        metadata.nif = nif.trim();
        metadata.organization_type = clientType;
      }

      await signUp(email, password, metadata);

      if (role === "technician" || role === "vendor" || role === "delivery") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          if (role === "technician") {
            const documentPaths = await uploadDocuments(user.id, documents);
            await supabase
              .from("technicians")
              .update({
                specialties: selectedSpecialties,
                documents: documentPaths,
                bio: interviewData.previousExperience || null,
                years_experience: interviewData.yearsExperience || null,
                availability: interviewData.availability || null,
                work_areas: interviewData.workAreas || [],
                has_own_tools: interviewData.hasOwnTools || false,
                has_transport: interviewData.hasTransport || false,
                certifications: interviewData.certifications || null,
                motivation: interviewData.motivation || null,
                previous_experience: interviewData.previousExperience || null,
              })
              .eq("user_id", user.id);
          } else if (role === "vendor") {
            const documentPaths = await uploadDocuments(user.id, vendorDocuments);
            await supabase
              .from("vendors")
              .update({
                documents: documentPaths,
                years_experience: vendorInterviewData.yearsExperience || null,
                availability: vendorInterviewData.availability || null,
                work_areas: vendorInterviewData.workAreas || [],
                certifications: vendorInterviewData.certifications || null,
                motivation: vendorInterviewData.motivation || null,
                previous_experience: vendorInterviewData.previousExperience || null,
              })
              .eq("user_id", user.id);
          } else if (role === "delivery") {
            const documentPaths = await uploadDocuments(user.id, deliveryDocuments);
            await supabase
              .from("delivery_persons")
              .update({
                documents: documentPaths,
                vehicle_type: deliveryInterviewData.vehicleType || null,
                years_experience: deliveryInterviewData.yearsExperience || null,
                availability: deliveryInterviewData.availability || null,
                work_areas: deliveryInterviewData.workAreas || [],
                certifications: deliveryInterviewData.certifications || null,
                motivation: deliveryInterviewData.motivation || null,
                previous_experience: deliveryInterviewData.previousExperience || null,
              })
              .eq("user_id", user.id);
          }
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: (role === "technician" || role === "vendor" || role === "delivery")
          ? "Sua conta será analisada pela nossa equipe."
          : "Você já pode começar a usar a plataforma.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientTypeChange = (value: string) => {
    setClientType(value);
    if (value === "personal") {
      setCompanyName("");
      setNif("");
    }
  };

  const getStepInfo = () => {
    const techSteps = [
      { icon: UserCheck, title: "Tipo de Conta", desc: "Escolha seu perfil" },
      { icon: ClipboardList, title: "Entrevista", desc: "Conte-nos sobre você" },
      { icon: FileText, title: "Documentos", desc: "Envie suas credenciais" },
      { icon: User, title: "Criar Conta", desc: "Finalize o cadastro" },
    ];
    
    const clientSteps = [
      { icon: UserCheck, title: "Tipo de Conta", desc: "Escolha seu perfil" },
      { icon: User, title: "Criar Conta", desc: "Seus dados" },
    ];

    const vendorSteps = [
      { icon: UserCheck, title: "Tipo de Conta", desc: "Escolha seu perfil" },
      { icon: ClipboardList, title: "Entrevista", desc: "Conte-nos sobre seu negócio" },
      { icon: FileText, title: "Documentos", desc: "Envie suas credenciais" },
      { icon: User, title: "Criar Conta", desc: "Finalize o cadastro" },
    ];

    const deliverySteps = [
      { icon: UserCheck, title: "Tipo de Conta", desc: "Escolha seu perfil" },
      { icon: ClipboardList, title: "Entrevista", desc: "Conte-nos sobre você" },
      { icon: FileText, title: "Documentos", desc: "Envie suas credenciais" },
      { icon: User, title: "Criar Conta", desc: "Finalize o cadastro" },
    ];

    if (role === "technician") return techSteps;
    if (role === "vendor") return vendorSteps;
    if (role === "delivery") return deliverySteps;
    return clientSteps;
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative min-h-screen flex flex-col px-4 py-6 safe-area-inset">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          {!isFirstStep ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          ) : (
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Início
              </Button>
            </Link>
          )}
          <Link to="/login" className="text-sm text-primary hover:underline">
            Já tenho conta
          </Link>
        </div>

        {/* Logo & Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-2xl" />
              <div className="relative w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Kilende</span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {stepInfo.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "gradient-primary text-primary-foreground shadow-lg"
                        : isComplete
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  {index < stepInfo.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        index < currentStepIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{stepInfo[currentStepIndex]?.title}</p>
            <p className="text-xs text-muted-foreground">{stepInfo[currentStepIndex]?.desc}</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="flex-1 w-full max-w-md mx-auto">
          <div className="glass-card p-5 rounded-3xl border border-border/50 shadow-2xl">
            <form onSubmit={handleRegister}>
              <AnimatePresence mode="wait">
                {/* Step 1: Role Selection */}
                {currentStep === "role" && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-bold text-foreground text-center mb-4">
                      Como deseja usar o Kilende?
                    </h2>
                    
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => setRole(value as UserRole)}
                      className="space-y-3"
                    >
                      {[
                        { id: "client", icon: User, title: "Preciso de Serviços", desc: "Encontre técnicos e compre produtos" },
                        { id: "technician", icon: Wrench, title: "Sou Técnico", desc: "Ofereça seus serviços profissionais" },
                        { id: "vendor", icon: Store, title: "Sou Vendedor", desc: "Venda produtos na plataforma" },
                        { id: "delivery", icon: Truck, title: "Sou Entregador", desc: "Faça entregas e ganhe dinheiro" },
                      ].map(opt => (
                        <Label
                          key={opt.id}
                          htmlFor={opt.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            role === opt.id
                              ? "border-primary bg-primary/10 shadow-lg"
                              : "border-border/50 hover:border-primary/50 bg-secondary/30"
                          }`}
                        >
                          <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            role === opt.id ? "gradient-primary" : "bg-secondary"
                          }`}>
                            <opt.icon className={`w-6 h-6 ${role === opt.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <span className={`font-semibold ${role === opt.id ? "text-primary" : "text-foreground"}`}>
                              {opt.title}
                            </span>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          {role === opt.id && <CheckCircle className="w-5 h-5 text-primary" />}
                        </Label>
                      ))}
                    </RadioGroup>

                     {(role === "technician" || role === "vendor" || role === "delivery") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                      >
                        <p className="text-sm text-foreground">
                          <strong>Processo de cadastro:</strong> {role === "technician" ? "Como técnico" : role === "vendor" ? "Como vendedor" : "Como entregador"}, você passará por uma breve entrevista e enviará seus documentos para verificação.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Interview */}
                {currentStep === "interview" && (
                  <motion.div
                    key="interview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
                  >
                    <h2 className="text-xl font-bold text-foreground text-center mb-2">
                      {role === "vendor" ? "Sobre o seu Negócio" : role === "delivery" ? "Perfil de Entregador" : "Questionário de Entrevista"}
                    </h2>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {role === "vendor" ? "Ajude-nos a conhecer o seu negócio" : role === "delivery" ? "Precisamos saber mais sobre a sua experiência" : "Ajude-nos a conhecer você melhor"}
                    </p>
                    
                    {role === "technician" && (
                      <TechnicianInterviewForm
                        data={interviewData}
                        onComplete={setInterviewData}
                      />
                    )}
                    {role === "vendor" && (
                      <VendorInterviewForm
                        data={vendorInterviewData}
                        onComplete={setVendorInterviewData}
                      />
                    )}
                    {role === "delivery" && (
                      <DeliveryInterviewForm
                        data={deliveryInterviewData}
                        onComplete={setDeliveryInterviewData}
                      />
                    )}
                  </motion.div>
                )}

                {/* Step 3: Documents */}
                {currentStep === "documents" && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-bold text-foreground text-center mb-2">
                      {role === "technician" ? "Especialidades e Documentos" : "Documentos"}
                    </h2>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {role === "technician" 
                        ? "Selecione suas áreas de atuação e envie documentos" 
                        : "Envie seus documentos de identificação e certificações"}
                    </p>
                    
                    {role === "technician" ? (
                      <TechnicianRegistrationFields
                        selectedSpecialties={selectedSpecialties}
                        onSpecialtiesChange={setSelectedSpecialties}
                        documents={documents}
                        onDocumentsChange={setDocuments}
                      />
                    ) : (
                      <TechnicianRegistrationFields
                        selectedSpecialties={[]}
                        onSpecialtiesChange={() => {}}
                        documents={role === "vendor" ? vendorDocuments : deliveryDocuments}
                        onDocumentsChange={role === "vendor" ? setVendorDocuments : setDeliveryDocuments}
                        hideSpecialties
                      />
                    )}
                  </motion.div>
                )}

                {/* Step 4: Account Details */}
                {currentStep === "account" && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-bold text-foreground text-center mb-4">
                      {role === "client" ? "Dados da Conta" : "Finalize seu Cadastro"}
                    </h2>

                    {/* Client type selector */}
                    {role === "client" && (
                      <div className="space-y-4 mb-4">
                        <ClientTypeSelector 
                          value={clientType} 
                          onChange={handleClientTypeChange} 
                        />
                        
                        <OrganizationFields
                          clientType={clientType}
                          companyName={companyName}
                          nif={nif}
                          onCompanyNameChange={setCompanyName}
                          onNifChange={setNif}
                        />
                      </div>
                    )}

                    {/* Vendor fields */}
                    {role === "vendor" && (
                      <div className="space-y-4">
                        {/* Vendor type: Personal or Company */}
                        <div className="space-y-2">
                          <Label className="text-foreground font-medium">Tipo de Vendedor</Label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setVendorType("singular")}
                              className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${vendorType === "singular" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}
                            >
                              <User className={`w-6 h-6 mx-auto mb-1 ${vendorType === "singular" ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`text-sm font-medium ${vendorType === "singular" ? "text-primary" : "text-foreground"}`}>Pessoal</span>
                              <p className="text-xs text-muted-foreground mt-0.5">Vendedor individual</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorType("empresa")}
                              className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${vendorType === "empresa" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}
                            >
                              <Store className={`w-6 h-6 mx-auto mb-1 ${vendorType === "empresa" ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`text-sm font-medium ${vendorType === "empresa" ? "text-primary" : "text-foreground"}`}>Empresa</span>
                              <p className="text-xs text-muted-foreground mt-0.5">Pessoa jurídica</p>
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-foreground font-medium">{vendorType === "empresa" ? "Nome da Empresa / Loja" : "Nome da Loja"}</Label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                              <Store className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input placeholder={vendorType === "empresa" ? "Nome da empresa" : "Nome da sua loja"} value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all" required />
                          </div>
                        </div>

                        {/* NIF for company vendors */}
                        {vendorType === "empresa" && (
                          <div>
                            <Label className="text-foreground font-medium">NIF da Empresa *</Label>
                            <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <FileText className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              </div>
                              <Input placeholder="Ex: 5000123456" value={nif} onChange={(e) => setNif(e.target.value)} className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all" required />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery fields */}
                    {role === "delivery" && (
                      <div>
                        <Label className="text-foreground font-medium">Tipo de Veículo</Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Truck className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          </div>
                          <Input placeholder="Ex: Moto, Carro, Bicicleta" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Name field - for personal clients, technicians, vendors, delivery */}
                    {(role === "technician" || role === "vendor" || role === "delivery" || (role === "client" && clientType === "personal")) && (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-medium">Nome Completo</Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <User className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          </div>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Mail className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground font-medium">Telefone</Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Phone className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+244 9XX XXX XXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirmar</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {isLastStep ? (
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold gradient-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    disabled={!canProceed() || loading || uploading}
                  >
                    {loading || uploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {uploading ? "Enviando documentos..." : "Criando conta..."}
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Criar Conta
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 text-base font-semibold gradient-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    disabled={!canProceed()}
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-4 px-4">
            Ao criar uma conta, você concorda com os{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
            {" "}e{" "}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
