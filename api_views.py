from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.contrib.auth.models import User
from .models import Patient, Doctor
from .serializers import (
    PatientRegistrationSerializer,
    PatientLoginSerializer,
    PatientInfoSerializer,
    DoctorListSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def patient_register_api(request):
    """
    患者注册API
    
    请求参数:
    {
        "first_name": "张",
        "last_name": "三",
        "username": "zhangsan",
        "password": "123456",
        "confirm_password": "123456",
        "mobile": "13800138000",
        "address": "北京市朝阳区",
        "symptoms": "头痛",
        "assigned_doctor_id": 1  // 可选，医生的user_id
    }
    
    返回:
    {
        "success": true,
        "message": "注册成功，请等待管理员审核",
        "data": {
            "user_id": 1,
            "username": "zhangsan",
            "full_name": "张三"
        }
    }
    """
    serializer = PatientRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'success': True,
                'message': '注册成功，请等待管理员审核',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'full_name': f"{user.first_name}{user.last_name}"
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'注册失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'success': False,
        'message': '注册失败',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def patient_login_api(request):
    """
    患者登录API
    
    请求参数:
    {
        "username": "zhangsan",
        "password": "123456"
    }
    
    返回:
    {
        "success": true,
        "message": "登录成功",
        "data": {
            "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
            "user_info": {
                "user_id": 1,
                "username": "zhangsan",
                "full_name": "张三"
            },
            "patient_info": {
                "id": 1,
                "mobile": "13800138000",
                "address": "北京市朝阳区",
                "symptoms": "头痛",
                "assigned_doctor_name": "李医生",
                "admit_date": "2024-01-01",
                "status": true
            }
        }
    }
    """
    serializer = PatientLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # 获取或创建token
        token, created = Token.objects.get_or_create(user=user)
        
        # 获取患者信息
        try:
            patient = Patient.objects.get(user=user)
            patient_serializer = PatientInfoSerializer(patient)
            
            return Response({
                'success': True,
                'message': '登录成功',
                'data': {
                    'token': token.key,
                    'user_info': {
                        'user_id': user.id,
                        'username': user.username,
                        'full_name': f"{user.first_name}{user.last_name}"
                    },
                    'patient_info': patient_serializer.data
                }
            }, status=status.HTTP_200_OK)
        except Patient.DoesNotExist:
            return Response({
                'success': False,
                'message': '患者信息不存在',
                'data': None
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'success': False,
        'message': '登录失败',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_info_api(request):
    """
    获取当前登录患者信息API
    
    需要在请求头中包含: Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
    
    返回:
    {
        "success": true,
        "message": "获取成功",
        "data": {
            "id": 1,
            "user_info": {
                "id": 1,
                "username": "zhangsan",
                "first_name": "张",
                "last_name": "三",
                "full_name": "张三"
            },
            "address": "北京市朝阳区",
            "mobile": "13800138000",
            "symptoms": "头痛",
            "assignedDoctorId": 1,
            "assigned_doctor_name": "李医生",
            "admitDate": "2024-01-01",
            "status": true
        }
    }
    """
    try:
        patient = Patient.objects.get(user=request.user)
        serializer = PatientInfoSerializer(patient)
        
        return Response({
            'success': True,
            'message': '获取成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Patient.DoesNotExist:
        return Response({
            'success': False,
            'message': '患者信息不存在',
            'data': None
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def doctors_list_api(request):
    """
    获取可用医生列表API
    
    返回:
    {
        "success": true,
        "message": "获取成功",
        "data": [
            {
                "id": 1,
                "doctor_name": "李医生",
                "department": "Cardiologist",
                "address": "医院地址",
                "mobile": "13900139000"
            }
        ]
    }
    """
    doctors = Doctor.objects.filter(status=True)
    serializer = DoctorListSerializer(doctors, many=True)
    
    return Response({
        'success': True,
        'message': '获取成功',
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def patient_logout_api(request):
    """
    患者登出API
    
    需要在请求头中包含: Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
    
    返回:
    {
        "success": true,
        "message": "登出成功",
        "data": null
    }
    """
    try:
        # 删除用户的token
        request.user.auth_token.delete()
        return Response({
            'success': True,
            'message': '登出成功',
            'data': None
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'登出失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_patient_info_api(request):
    """
    更新患者信息API
    
    请求参数:
    {
        "mobile": "13800138001",
        "address": "上海市浦东新区",
        "symptoms": "发烧"
    }
    
    返回:
    {
        "success": true,
        "message": "更新成功",
        "data": {
            // 更新后的患者信息
        }
    }
    """
    try:
        patient = Patient.objects.get(user=request.user)
        
        # 只允许更新特定字段
        allowed_fields = ['mobile', 'address', 'symptoms']
        for field in allowed_fields:
            if field in request.data:
                setattr(patient, field, request.data[field])
        
        patient.save()
        
        serializer = PatientInfoSerializer(patient)
        return Response({
            'success': True,
            'message': '更新成功',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Patient.DoesNotExist:
        return Response({
            'success': False,
            'message': '患者信息不存在',
            'data': None
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'更新失败: {str(e)}',
            'data': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)