import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
        description: 'This dashboard gives you a complete overview of your finances with account balances, spending patterns, and recent transaction activity. Track your financial health at a glance.',
        videoUrl: '/videos/test-video.mp4',
        videoType: 'mp4',
        sidebarItem: 'Dashboard',
    },
    {
        id: 'accounts',
        title: 'Manage Multiple Accounts',
        description: 'Keep track of all your financial accounts in one place. View balances, transaction history, and transfer between accounts with ease.',
        videoUrl: '/videos/test-video.mp4',
        videoType: 'mp4',
        sidebarItem: 'Accounts',
    },
    {
        id: 'tags',
        title: 'Smart Transaction Categorization',
        description: 'Automatically organize your transactions with custom categories and intelligent tagging rules. Track spending patterns and generate detailed reports.',
        videoUrl: '/videos/test-video.mp4',
        videoType: 'mp4',
        sidebarItem: 'Tags',
    },
    {
        id: 'csv-schemas',
        title: 'Custom Import Formats',
        description: 'Define custom formats for importing bank statements from different institutions. Support various CSV structures and date formats.',
        videoUrl: '/videos/test-video.mp4',
        videoType: 'mp4',
        sidebarItem: 'CSV Schemas',
    },
    {
        id: 'imports',
        title: 'Import History & Management',
        description: 'View and manage your imported statements. Track import history, review processed transactions, and handle any import issues.',
        videoUrl: '/videos/test-video.mp4',
        videoType: 'mp4',
        sidebarItem: 'Imports',
    },
    {
        id: 'import-statement',
        title: 'Upload & Process Statements',
        description: 'Upload bank statements and automatically process them with smart categorization. Import transactions quickly and accurately.',
        videoUrl: '/videos/test-video.mp4',
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

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = (error: any) => {
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
                        src={`${videoUrl}?autoplay=1&mute=1&loop=1&playlist=${videoUrl.split('/').pop()}`}
                        title="Feature demonstration"
                        className="w-full h-48 sm:h-64 rounded-lg"
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
                        src={`${videoUrl}?autoplay=1&muted=1&loop=1`}
                        title="Feature demonstration"
                        className="w-full h-48 sm:h-64 rounded-lg"
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
                        ref={videoRef}
                        className="w-full h-48 sm:h-64 rounded-lg"
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
            <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Video unavailable
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Video content could not be loaded
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
    const [isPlaying, setIsPlaying] = useState(false);

    const currentTourStep = tourSteps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === tourSteps.length - 1;

    useEffect(() => {
        if (isOpen) {
            // Reset to first step when tour opens
            setCurrentStep(0);
            // Highlight the current sidebar item
            highlightSidebarItem(currentTourStep.sidebarItem);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Highlight the current sidebar item
            highlightSidebarItem(currentTourStep.sidebarItem);
        }
    }, [currentStep, isOpen]);

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
    }, [isOpen, currentStep]);

    const highlightSidebarItem = (itemTitle: string) => {
        // Remove previous highlights
        document.querySelectorAll('.sidebar-item-highlight').forEach(el => {
            el.classList.remove('sidebar-item-highlight');
        });

        // Add highlight to current item
        const sidebarItems = document.querySelectorAll('[data-sidebar-item]');
        sidebarItems.forEach(item => {
            if (item.getAttribute('data-sidebar-item') === itemTitle) {
                item.classList.add('sidebar-item-highlight');
            }
        });
    };

    const handleNext = () => {
        if (isLastStep) {
            // Remove highlights before closing
            document.querySelectorAll('.sidebar-item-highlight').forEach(el => {
                el.classList.remove('sidebar-item-highlight');
            });
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const handleClose = () => {
        // Remove any remaining highlights
        document.querySelectorAll('.sidebar-item-highlight').forEach(el => {
            el.classList.remove('sidebar-item-highlight');
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Custom overlay that doesn't cover the sidebar on desktop */}
            <div
                className="fixed inset-0 bg-black/80 z-40 md:block hidden"
                style={{
                    left: 'var(--sidebar-width, 280px)',
                    width: 'calc(100vw - var(--sidebar-width, 280px))'
                }}
                onClick={handleClose}
            />

            {/* Full overlay for mobile */}
            <div
                className="fixed inset-0 bg-black/80 z-40 md:hidden"
                onClick={handleClose}
            />

            {/* Tour Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
                <div
                    className="bg-background border rounded-lg shadow-lg w-full max-w-2xl h-[90vh] pointer-events-auto flex flex-col overflow-hidden md:block"
                    style={{
                        marginLeft: 'max(calc(var(--sidebar-width, 280px) + 1rem), 1rem)',
                        marginRight: '1rem',
                        maxWidth: 'calc(100vw - 2rem)'
                    }}
                >
                    {/* Mobile Modal - Full screen on mobile */}
                    <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-orange-600 font-semibold text-sm">
                                            {currentStep + 1}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-orange-600">Demo Tour</h2>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-sm text-muted-foreground">
                                        Step {currentStep + 1} of {tourSteps.length}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClose}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Progress Bar */}
                            <div className="px-4 mb-4 flex-shrink-0">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Content - Scrollable Area */}
                            <div className="flex-1 overflow-y-auto px-4">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">{currentTourStep.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-sm">
                                            {currentTourStep.description}
                                        </p>
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
                            <div className="flex items-center justify-between p-4 pt-3 border-t flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    className="text-muted-foreground hover:text-foreground text-sm"
                                >
                                    <SkipForward className="h-4 w-4 mr-2" />
                                    Skip Tour
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={isFirstStep}
                                        className="flex items-center gap-1 text-sm"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-sm"
                                    >
                                        <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                        {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Keyboard Shortcuts Hint */}
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
                                <p className="text-xs text-muted-foreground text-center">
                                    Use arrow keys to navigate • Press Escape to close
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Modal */}
                    <div className="hidden md:flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 pb-2 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-orange-600 font-semibold text-sm">
                                        {currentStep + 1}
                                    </span>
                                </div>
                                <h2 className="text-lg font-semibold text-orange-600">Demo Tour</h2>
                                <span className="text-muted-foreground">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Step {currentStep + 1} of {tourSteps.length}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-4 sm:px-6 mb-4 flex-shrink-0">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Content - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{currentTourStep.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                                        {currentTourStep.description}
                                    </p>
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
                        <div className="flex items-center justify-between p-4 sm:p-6 pt-3 border-t flex-shrink-0">
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="text-muted-foreground hover:text-foreground text-sm"
                            >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip Tour
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={isFirstStep}
                                    className="flex items-center gap-1 sm:gap-2 text-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    className="flex items-center gap-1 sm:gap-2 bg-orange-600 hover:bg-orange-700 text-sm"
                                >
                                    <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Keyboard Shortcuts Hint */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-gray-100 flex-shrink-0">
                            <p className="text-xs text-muted-foreground text-center">
                                Use arrow keys to navigate • Press Escape to close
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 