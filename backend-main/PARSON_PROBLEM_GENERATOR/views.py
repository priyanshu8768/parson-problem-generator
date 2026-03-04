from django.shortcuts import render
import random
from .level1 import divide_python_code_into_blocks as block_easy
from .level2 import divide_python_code_into_blocks as block_medium
from .level3 import divide_python_code_into_blocks as block_hard
from .level3 import tokenize_python_code_block as tokenize
from .test import test_python_code
from .models import *
from rest_framework.decorators import api_view
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.db import transaction
from django.core.mail import EmailMessage
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from django.conf import settings
import jwt
import os


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'
import json
import string 
import random
from django.template import Template, Context
from rest_framework.viewsets import ModelViewSet
from .serializers import *


@api_view(['POST'])
def create_super_user(request):
    secret = getattr(settings, 'ADMIN_CREATION_SECRET', None)
    if not secret:
        return Response({'error': 'Admin creation is disabled.'}, status=status.HTTP_403_FORBIDDEN)
    provided = request.headers.get('X-Admin-Creation-Secret') or request.data.get('admin_secret')
    if provided != secret:
        return Response({'error': 'Invalid or missing admin creation secret.'}, status=status.HTTP_403_FORBIDDEN)
    password = request.data.get('password')
    email = request.data.get('email')
    if not password or not email:
        return Response({'error': 'Password and email are required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.create_superuser(email=email, password=password)
        return Response({'message': 'Superuser created successfully.'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TokenObtainPairView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if email is not None:
            email = email.strip()
        password = request.data.get("password")
        if password is not None:
            password = password.strip()
        user = authenticate(request, email=email, password=password)
        print("user",user)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            message = f"Successfully signed in. If not done by you please change your password."
            # send_mail(
            #     'New Login',
            #     message,
            #     '',
            #     [user.email],
            #     fail_silently=False,
            # )
            return Response({'access_token': access_token,'role':user.role}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class VerifyTokenView(APIView):
    permission_classes = (IsAuthenticated,)
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token not provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded_token = jwt.decode(token, settings.SIGNING_KEY, algorithms=[settings.JWT_ALGORITHM])
            return Response({"valid": True, "decoded_token": decoded_token}, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

class TokenRefreshView(APIView):
    permission_classes = (IsAuthenticated,)
    def post(self, request):
        refresh = RefreshToken.for_user(request.user)
        access_token = str(refresh.access_token)
        return Response({'access_token': access_token}, status=status.HTTP_200_OK)

class GetUserDetails(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        try:
            user = request.user
            data = {
                'username' : user.name,
                'email' : user.email,
                'role' : user.role,
            }
            return Response({'data':data},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits
    password = ''.join(random.choice(characters) for _ in range(length))
    return password

class Signup(APIView):
    def post(self,request):
        name = request.data.get('name')
        username = name  # Keep for compatibility
        email  = request.data.get('email').strip()
        password = request.data.get('password').strip()
        role = request.data.get('role', 'user')  # Default to 'user' if not provided

        try:
            account = User.objects.create_user(
                name=name, email=email, password=password, role=role
            )
            # send_mail(
            #     'Welcome',
            #     'Account Created Successfully. You can now login.',
            #     '',
            #     [account.email],
            #     fail_silently=False,
            # )
            return Response({"message": "Registration successful"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordAPIView(APIView):
    def post(self, request):
        data = request.data
        email = data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist.'}, status=404)
        else:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            reset_password_link = f"http://localhost:3000/reset/{uid}/{token}"

            email_template = """
            Hi {{ user.username }},
            Please click the link below to reset your password:
            {{ reset_password_link }}
            """
            template = Template(email_template)
            context = Context({
                'user': user,
                'reset_password_link': reset_password_link,
            })
            print(reset_password_link)
            message = template.render(context)

            # send_mail('Reset your password', message,'', [email])
            return Response({'success': 'Password reset email has been sent.'})

class ResetPasswordAPIView(APIView):
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid token.'}, status=400)
        else:
            if default_token_generator.check_token(user, token):
                return Response({'uidb64': uidb64, 'token': token})
            else:
                return Response({'error': 'Invalid token.'}, status=400)

    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid token.'}, status=400)
        else:
            print(default_token_generator.check_token(user, token))
            if default_token_generator.check_token(user, token):
                new_password = request.data.get('password')
                user.set_password(new_password)
                user.save()
                message = f"Password successfully changed. If not done by you please change your password."
                # send_mail(
                #     'Password Changed',
                #     message,
                #     '',
                #     [user.email],
                #     fail_silently=False,
                # )
                return Response({'success': 'Password has been reset successfully.'})
            else:
                return Response({'error': 'Invalid token.'}, status=400)

class changePassword(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')
        confirm_password = request.data.get('confirmPassword')

        if user.check_password(current_password):
            if new_password == confirm_password:
                user.set_password(new_password)
                user.save()
                message = f"Password successfully changed. If not done by you please change your password."
                # send_mail(
                #     'Password Changed',
                #     message,
                #     '',
                #     [user.email],
                #     fail_silently=False,
                # )
                return Response({'success': True})
            else:
                return Response({'success': False, 'message': 'New passwords do not match.'})
        else:
            return Response({'success': False, 'message': 'Invalid current password.'})


# Create your views here.

def shuffle_blocks(blocks):
    random.shuffle(blocks)
    return blocks

class shuffle(APIView):
    permission_classes = (IsAuthenticated,)
    def post(self,request):
        user = request.user
        data = request.data
        code = data['code']
        level = data['level']
        name = data['name']
        description = data['description']
        testcases = data['testcases']
        instructions = data['instructions']
        
        # Normalize test cases to prevent format issues
        normalized_testcases = []
        for tc in testcases:
            if isinstance(tc, dict) and 'input' in tc and 'output' in tc:
                # Normalize the output to prevent test case format issues
                normalized_output = normalize_test_case_output(tc['output'])
                normalized_testcases.append([tc['input'], normalized_output])
            elif isinstance(tc, list) and len(tc) == 2:
                # Normalize the output for list format too
                normalized_output = normalize_test_case_output(tc[1])
                normalized_testcases.append([str(tc[0]), normalized_output])
            else:
                # Keep original format if it doesn't match expected patterns
                normalized_testcases.append(tc)
        
        if level == 'EASY':
            new_blocks = block_easy(code)
        elif level == 'MEDIUM':
            new_blocks = block_medium(code)
        elif level == 'HARD':
            blocks = block_hard(code)
            new_blocks = []
            for block in blocks:
                new_blocks.append([tokenize('\n'.join(block))])
        shuffled_blocks = shuffle_blocks(new_blocks)
        print(type(shuffled_blocks))
        test = Test.objects.create(name = name,level = level,description = description,instructions = instructions,code = code,created_by = user)

        if test:
            test.set_test_cases(normalized_testcases)
            test.set_shuffled_blocks(shuffled_blocks)
            test.save()
            return Response({'message': 'Test Created...!'}, status=200)


class TestData(APIView):
    permission_classes = (IsAuthenticated,)
    def get(self, request, *args, **kwargs):
        user = request.user
        tests = Test.objects.all()
        serializer = TestSerializer(tests,many=True)
        return Response({'data': serializer.data}, status=200)

    def post(self,request):
        user = request.user
        id = request.data.get('id')
        test = Test.objects.get(id = id)
        data = {
            'name':test.name,
            'level' : test.level,
            'description' : test.description,
            'testcase' : test.testcases[0],
            'instructions' : test.instructions,
            'shuffled_blocks' : test.get_shuffled_blocks(),
            'created_by' : test.created_by.name,
        }
        return Response({'data': data}, status=200)

class Resultsubmit(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        results = Result.objects.filter(user = user)
        serializer = ResultSerializer(results,many=True)
        return Response({'data': serializer.data}, status=200)

    def post(self,request):
        user = request.user
        id = request.data.get('id')
        codeblocks = request.data.get('code')
        code = ""
        for codeblock in codeblocks:
            for codeline in codeblock:
                code += codeline + "\n"
        test = Test.objects.get(id = id)
        testcases = test.get_test_cases()
        resultmsg = test_python_code(code,testcases)
        result = Result.objects.create(user = user,test=test,result=resultmsg)
        
        # Check if tests failed and include AI explanation
        response_data = {'resultmsg': resultmsg}
        
        # Check if tests failed (more precise check)
        # Look for any "Test Failed!" in the result message
        # resultmsg is a list, so we need to check each item
        tests_failed = False
        if isinstance(resultmsg, list):
            # Check each test result for failures
            for result in resultmsg:
                if "Test Failed!" in result or "FAILED" in result.upper():
                    tests_failed = True
                    break
        else:
            # Handle string case (for backward compatibility)
            tests_failed = "Test Failed!" in resultmsg or "FAILED" in resultmsg.upper()
        
        if tests_failed:
            try:
                from .ai_feedback.explain_failure import explain_solution_failure
                
                # Generate AI explanation for failed solution
                explanation = explain_solution_failure(
                    problem_description=test.description,
                    correct_reference_solution=getattr(test, 'reference_solution', '') or "",  # Use getattr to handle missing attribute
                    user_generated_code=code,
                    test_failure_summary=resultmsg
                )
                
                response_data['ai_explanation'] = explanation
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate AI explanation: {str(e)}")
                # Include fallback explanation if AI generation fails
                response_data['ai_explanation'] = {
                    "overall_status": "needs_review",
                    "summary": "Your solution needs some adjustments to work correctly.",
                    "flow_issues": ["Logic needs review"],
                    "indentation_issues": None,
                    "missing_steps": ["Additional testing may be needed"],
                    "learning_guidance": [
                        "Carefully review the problem requirements",
                        "Test your solution with different inputs",
                        "Check for common edge cases"
                    ],
                    "encouragement_message": "Keep practicing! Review your logic and try again."
                }
        
        return Response(response_data, status=200)


class GenerateProblem(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        from .services.ai_generator import generate_problem, GeminiAPIKeyMissing, GeminiResponseInvalid
        import logging
        
        logger = logging.getLogger(__name__)
        
        difficulty = request.data.get('level', 'EASY')
        topic = request.data.get('topic', None)
        
        logger.info(f"AI generation request: level={difficulty}, topic={topic}")
        
        try:
            result = generate_problem(difficulty, topic)
            logger.info(f"AI generation successful for {difficulty} level")
            return Response(result, status=status.HTTP_200_OK)
            
        except GeminiAPIKeyMissing as e:
            logger.error(f"Gemini API key missing: {str(e)}")
            return Response(
                {'error': 'Gemini API key not configured.'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except GeminiResponseInvalid as e:
            logger.error(f"Gemini response invalid for {difficulty} level: {str(e)}")
            return Response(
                {'error': 'Invalid JSON response: Could not parse JSON after multiple attempts: line 1 column 1 (char 0)'}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
        except ValueError as e:
            logger.error(f"Value error in AI generation: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in AI generation: {str(e)}")
            # Catch any unexpected exceptions and return structured error
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def normalize_test_case_output(output):
    """
    Normalize test case output to ensure consistent format.
    Removes trailing newlines and standardizes whitespace.
    """
    if not isinstance(output, str):
        output = str(output)
    
    # Remove all trailing newlines
    normalized = output.rstrip('\n')
    
    # Ensure it's not empty after stripping (preserve original if it becomes empty)
    if not normalized and output:
        # If the original was only newlines, keep one newline to preserve intent
        if output.count('\n') == len(output):
            normalized = '\n'
        else:
            normalized = output
    
    return normalized


class SaveGeneratedProblem(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        data = request.data
        logger.info(f"SaveGeneratedProblem received data: {list(data.keys())}")
        
        for key in ('name', 'description', 'instructions', 'level', 'code', 'testcases'):
            if key not in data:
                logger.error(f"Missing required field: {key}")
                return Response({'error': f'Missing required field: {key}'}, status=status.HTTP_400_BAD_REQUEST)
        
        level = data['level']
        if level not in ('EASY', 'MEDIUM', 'HARD'):
            logger.error(f"Invalid level: {level}")
            return Response({'error': 'Level must be EASY, MEDIUM, or HARD.'}, status=status.HTTP_400_BAD_REQUEST)
        
        testcases = data['testcases']
        if not isinstance(testcases, list):
            logger.error(f"testcases is not an array: {type(testcases)}")
            return Response({'error': 'testcases must be an array.'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Processing {len(testcases)} testcases")
        
        # Convert new format {input, output} to legacy format [input, output] for compatibility
        converted_testcases = []
        for i, tc in enumerate(testcases):
            if isinstance(tc, dict) and 'input' in tc and 'output' in tc:
                # Normalize the output to prevent test case format issues
                normalized_output = normalize_test_case_output(tc['output'])
                converted_testcases.append([tc['input'], normalized_output])
                logger.info(f"Converted testcase {i}: {tc} -> normalized output: {repr(normalized_output)}")
            elif isinstance(tc, list) and len(tc) == 2:
                # Normalize the output for list format too
                normalized_output = normalize_test_case_output(tc[1])
                converted_testcases.append([str(tc[0]), normalized_output])
                logger.info(f"Using testcase {i} as list: {tc} -> normalized output: {repr(normalized_output)}")
            else:
                logger.error(f"Invalid testcase format {i}: {tc}")
                return Response({'error': 'Each test case must be {input, output} object or [input, output] array.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            code = data['code']
            logger.info(f"Processing {level} problem with {len(code)} characters")
            
            if level == 'EASY':
                new_blocks = block_easy(code)
            elif level == 'MEDIUM':
                new_blocks = block_medium(code)
            else:
                blocks = block_hard(code)
                new_blocks = []
                for block in blocks:
                    new_blocks.append([tokenize('\n'.join(block))])
            
            shuffled_blocks = shuffle_blocks(new_blocks)
            logger.info(f"Created {len(new_blocks)} blocks, shuffled successfully")
            
            test = Test.objects.create(
                name=data['name'],
                level=level,
                description=data['description'],
                instructions=data['instructions'],
                code=code,
                created_by=request.user
            )
            test.set_test_cases(converted_testcases)
            test.set_shuffled_blocks(shuffled_blocks)
            test.save()
            
            logger.info(f"Problem saved successfully with ID: {test.id}")
            return Response({'message': 'Problem saved successfully.', 'id': str(test.id)}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error saving problem: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProblemList(APIView):
    permission_classes = [IsAuthenticated]  # Allow any authenticated user to see problems

    def get(self, request):
        tests = Test.objects.all().select_related('created_by').order_by('-id')
        counts = {'EASY': 0, 'MEDIUM': 0, 'HARD': 0}
        items = []
        for t in tests:
            counts[t.level] = counts.get(t.level, 0) + 1
            items.append({
                'id': str(t.id),
                'name': t.name,
                'level': t.level,
                'created_by': t.created_by.name if t.created_by else '—',
            })
        return Response({'data': items, 'counts': counts}, status=status.HTTP_200_OK)


class ProblemDetail(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            test = Test.objects.get(id=pk)
        except Test.DoesNotExist:
            return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id': str(test.id),
            'name': test.name,
            'level': test.level,
            'description': test.description,
            'instructions': test.instructions,
            'code': test.code,
            'testcases': test.get_test_cases(),
            'created_by': test.created_by.name if test.created_by else '—',
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            test = Test.objects.get(id=pk)
        except Test.DoesNotExist:
            return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        for field in ('name', 'level', 'description', 'instructions', 'code'):
            if field in data:
                setattr(test, field, data[field])
        if 'testcases' in data:
            # Normalize test cases to prevent format issues
            testcases = data['testcases']
            normalized_testcases = []
            for tc in testcases:
                if isinstance(tc, dict) and 'input' in tc and 'output' in tc:
                    # Normalize the output to prevent test case format issues
                    normalized_output = normalize_test_case_output(tc['output'])
                    normalized_testcases.append([tc['input'], normalized_output])
                elif isinstance(tc, list) and len(tc) == 2:
                    # Normalize the output for list format too
                    normalized_output = normalize_test_case_output(tc[1])
                    normalized_testcases.append([str(tc[0]), normalized_output])
                else:
                    # Keep original format if it doesn't match expected patterns
                    normalized_testcases.append(tc)
            test.set_test_cases(normalized_testcases)
        if 'code' in data and 'level' in data:
            level = data['level']
            code = data['code']
            try:
                if level == 'EASY':
                    new_blocks = block_easy(code)
                elif level == 'MEDIUM':
                    new_blocks = block_medium(code)
                else:
                    blocks = block_hard(code)
                    new_blocks = []
                    for block in blocks:
                        new_blocks.append([tokenize('\n'.join(block))])
                test.set_shuffled_blocks(shuffle_blocks(new_blocks))
            except Exception:
                pass
        test.save()
        return Response({'message': 'Problem updated.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            test = Test.objects.get(id=pk)
        except Test.DoesNotExist:
            return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)
        test.delete()
        return Response({'message': 'Problem deleted.'}, status=status.HTTP_200_OK)
