import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TourStep {
    id: string;
    title: string;
    description: string;
    videoUrl?: string;
    videoType?: 'youtube' | 'vimeo' | 'mp4' | 'webm';
    sidebarItem: string;
}

const tourSteps: TourStep[] = [
    {
        id: 'dashboard',
        title: 'Your Financial Command Center',
        description:
            'This dashboard gives you a complete overview of your finances with account balances, spending patterns, and recent transaction activity. Track your financial health at a glance.',
        videoUrl: '/videos/Dashboard.mp4',
        videoType: 'mp4',
        sidebarItem: 'Dashboard',
    },
    {
        id: 'accounts',
        title: 'Manage Multiple Accounts',
        description:
            'Keep track of all your financial accounts in one place. View balances, transaction history, and transfer between accounts with ease.',
        videoUrl: '/videos/Accounts.mp4',
        videoType: 'mp4',
        sidebarItem: 'Accounts',
    },
    {
        id: 'tags',
        title: 'Smart Transaction Categorization',
        description:
            'Automatically organize your transactions with custom categories and intelligent tagging rules. Track spending patterns and generate detailed reports.',
        videoUrl: '/videos/Tags.mp4',
        videoType: 'mp4',
        sidebarItem: 'Tags',
    },
    {
        id: 'csv-schemas',
        title: 'Custom Import Formats',
        description:
            'Define custom formats for importing bank statements from different institutions. Support various CSV structures and date formats.',
        videoUrl: '/videos/Schemas.mp4',
        videoType: 'mp4',
        sidebarItem: 'CSV Schemas',
    },
    {
        id: 'imports',
        title: 'Import History & Management',
        description: 'View and manage your imported statements. Track import history, review processed transactions, and handle any import issues.',
        videoUrl: '/videos/Imports.mp4',
        videoType: 'mp4',
        sidebarItem: 'Imports',
    },
    {
        id: 'import-statement',
        title: 'Upload & Process Statements',
        description: 'Upload bank statements and automatically process them with smart categorization. Import transactions quickly and accurately.',
        videoUrl: '/videos/Importing.mp4',
        videoType: 'mp4',
        sidebarItem: 'Import Statement',
    },
];

interface VideoPlayerProps {
    videoUrl: string;
    videoType: 'youtube' | 'vimeo' | 'mp4' | 'webm';
    stepId: string;
}

function VideoPlayer({ videoUrl, videoType, stepId }: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset states when step changes
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [stepId]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleCanPlay = () => {
        setIsLoading(false);
        // Autoplay without sound
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                // Autoplay failed, but that's okay
                console.log('Autoplay prevented by browser:', error);
            });
        }
    };

    // Restart video when step changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch((error) => {
                // Autoplay failed, but that's okay
                console.log('Autoplay prevented by browser:', error);
            });
        }
    }, [stepId]);

    const renderVideo = () => {
        switch (videoType) {
            case 'youtube':
                return (
                    <iframe
                        key={stepId} // Force re-render for each step
                        src={`${videoUrl}?autoplay=1&mute=1&loop=1&playlist=${videoUrl.split('/').pop()}`}
                        title="Feature demonstration"
                        className="h-48 w-full rounded-lg sm:h-64"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                );

            case 'vimeo':
                return (
                    <iframe
                        key={stepId} // Force re-render for each step
                        src={`${videoUrl}?autoplay=1&muted=1&loop=1`}
                        title="Feature demonstration"
                        className="h-48 w-full rounded-lg sm:h-64"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                );

            case 'mp4':
            case 'webm':
                return (
                    <video
                        key={stepId} // Force re-render for each step
                        ref={videoRef}
                        className="h-48 w-full rounded-lg sm:h-64"
                        muted
                        loop
                        playsInline
                        onLoadedData={handleCanPlay}
                        onError={handleError}
                    >
                        <source src={videoUrl} type={`video/${videoType}`} />
                        Your browser does not support the video tag.
                    </video>
                );

            default:
                return null;
        }
    };

    if (hasError) {
        return (
            <div className="rounded-lg bg-gray-100 p-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <Play className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">Video unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">Video content could not be loaded</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600"></div>
                </div>
            )}
            {renderVideo()}
        </div>
    );
}

interface DemoTourProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DemoTour({ isOpen, onClose }: DemoTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const sidebarItemRef = useRef<string>('');

    const currentTourStep = tourSteps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === tourSteps.length - 1;

    const highlightSidebarItem = useCallback((itemTitle: string) => {
        // Remove previous highlights
        document.querySelectorAll('.sidebar-item-highlight').forEach((el) => {
            el.classList.remove('sidebar-item-highlight');
        });

        // Add highlight to current item
        const sidebarItems = document.querySelectorAll('[data-sidebar-item]');
        sidebarItems.forEach((item) => {
            if (item.getAttribute('data-sidebar-item') === itemTitle) {
                item.classList.add('sidebar-item-highlight');
            }
        });
    }, []);

    const handleNext = useCallback(() => {
        if (isLastStep) {
            // Remove highlights before closing
            document.querySelectorAll('.sidebar-item-highlight').forEach((el) => {
                el.classList.remove('sidebar-item-highlight');
            });
            onClose();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    }, [isLastStep, onClose]);

    const handlePrevious = useCallback(() => {
        if (!isFirstStep) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [isFirstStep]);

    const handleClose = useCallback(() => {
        // Remove any remaining highlights
        document.querySelectorAll('.sidebar-item-highlight').forEach((el) => {
            el.classList.remove('sidebar-item-highlight');
        });
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            // Reset to first step when tour opens
            setCurrentStep(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && currentTourStep.sidebarItem !== sidebarItemRef.current) {
            // Highlight the current sidebar item
            sidebarItemRef.current = currentTourStep.sidebarItem;
            highlightSidebarItem(currentTourStep.sidebarItem);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isOpen, highlightSidebarItem]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case 'ArrowRight':
                case ' ':
                    event.preventDefault();
                    handleNext();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    handlePrevious();
                    break;
                case 'Escape':
                    event.preventDefault();
                    handleClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, handleNext, handlePrevious]);

    if (!isOpen) return null;

    return (
        <>
            {/* Custom overlay that doesn't cover the sidebar on desktop */}
            <div
                className="fixed inset-0 z-40 hidden bg-black/80 md:block"
                style={{
                    left: 'var(--sidebar-width, 280px)',
                    width: 'calc(100vw - var(--sidebar-width, 280px))',
                }}
                onClick={handleClose}
            />

            {/* Full overlay for mobile */}
            <div className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={handleClose} />

            {/* Tour Modal */}
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="pointer-events-auto flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-background shadow-lg md:block"
                    style={{
                        marginLeft: 'max(calc(var(--sidebar-width, 280px) + 1rem), 1rem)',
                        marginRight: '1rem',
                        maxWidth: 'calc(100vw - 2rem)',
                    }}
                >
                    {/* Mobile Modal - Full screen on mobile */}
                    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background md:hidden">
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex flex-shrink-0 items-center justify-between p-4 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                        <span className="text-sm font-semibold text-orange-600">{currentStep + 1}</span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-orange-600">Demo Tour</h2>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-sm text-muted-foreground">
                                        Step {currentStep + 1} of {tourSteps.length}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4 flex-shrink-0 px-4">
                                <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                        className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Content - Scrollable Area */}
                            <div className="flex-1 overflow-y-auto px-4">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="mb-2 text-lg font-semibold">{currentTourStep.title}</h3>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{currentTourStep.description}</p>
                                    </div>

                                    {/* Video Player */}
                                    {currentTourStep.videoUrl && currentTourStep.videoType && (
                                        <VideoPlayer
                                            videoUrl={currentTourStep.videoUrl}
                                            videoType={currentTourStep.videoType}
                                            stepId={currentTourStep.id}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Navigation - Fixed at Bottom */}
                            <div className="flex flex-shrink-0 items-center justify-end border-t p-4 pt-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={isFirstStep}
                                        className="flex items-center gap-1 text-sm"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <Button onClick={handleNext} className="flex items-center gap-1 bg-orange-600 text-sm hover:bg-orange-700">
                                        <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                        {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Keyboard Shortcuts Hint */}
                            <div className="flex-shrink-0 border-t border-gray-100 px-4 pt-2 pb-4">
                                <p className="text-center text-xs text-muted-foreground">Use arrow keys to navigate • Press Escape to close</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Modal */}
                    <div className="hidden h-full flex-col md:flex">
                        {/* Header */}
                        <div className="flex flex-shrink-0 items-center justify-between p-4 pb-2 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <span className="text-sm font-semibold text-orange-600">{currentStep + 1}</span>
                                </div>
                                <h2 className="text-lg font-semibold text-orange-600">Demo Tour</h2>
                                <span className="text-muted-foreground">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Step {currentStep + 1} of {tourSteps.length}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4 flex-shrink-0 px-4 sm:px-6">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                    className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Content - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-2 text-lg font-semibold sm:text-xl">{currentTourStep.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{currentTourStep.description}</p>
                                </div>

                                {/* Video Player */}
                                {currentTourStep.videoUrl && currentTourStep.videoType && (
                                    <VideoPlayer
                                        videoUrl={currentTourStep.videoUrl}
                                        videoType={currentTourStep.videoType}
                                        stepId={currentTourStep.id}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Navigation - Fixed at Bottom */}
                        <div className="flex flex-shrink-0 items-center justify-end border-t p-4 pt-3 sm:p-6">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={isFirstStep}
                                    className="flex items-center gap-1 text-sm sm:gap-2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <Button onClick={handleNext} className="flex items-center gap-1 bg-orange-600 text-sm hover:bg-orange-700 sm:gap-2">
                                    <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Keyboard Shortcuts Hint */}
                        <div className="flex-shrink-0 border-t border-gray-100 px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
                            <p className="text-center text-xs text-muted-foreground">Use arrow keys to navigate • Press Escape to close</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
