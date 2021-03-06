<?php

namespace JhFlexiTimeTest\Form\Factory;

use JhFlexiTime\Form\Factory\BookingFormFactory;
use Zend\Form\FormElementManager;

/**
 * Class BookingFormFactoryTest
 * @package JhFlexiTimeTest\Form\Factory
 * @author Aydin Hassan <aydin@wearejh.com>
 */
class BookingFormFactoryTest extends \PHPUnit_Framework_TestCase
{
    public function testFactoryProcessesWithoutErrors()
    {
        $authService = $this->getMock('\Zend\Authentication\AuthenticationServiceInterface');
        $authService
            ->expects($this->once())
            ->method('getIdentity')
            ->will($this->returnValue($this->getMock('ZfcUser\Entity\UserInterface')));

        $services = [
            'JhFlexiTime\ObjectManager' => $this->getMock('Doctrine\Common\Persistence\ObjectManager'),
            'zfcuser_auth_service'      => $authService,
        ];

        $serviceLocator = $this->getMock('Zend\ServiceManager\ServiceLocatorInterface');
        $serviceLocator
            ->expects($this->any())
            ->method('get')
            ->will(
                $this->returnCallback(
                    function ($serviceName) use ($services) {
                        return $services[$serviceName];
                    }
                )
            );

        $formElementManager = new FormElementManager();
        $formElementManager->setServiceLocator($serviceLocator);

        $factory = new BookingFormFactory();
        $this->assertInstanceOf('JhFlexiTime\Form\BookingForm', $factory->createService($formElementManager));
    }
}
